from typing import List, Optional
from datetime import datetime
import logging

from app.repositories.quiz_session_repository import QuizSessionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.quiz_repository import QuizRepository

from app.schemas.quiz_session import QuizSession, QuizStatus, QuizType, QuestionAnswer
from app.utils.scoring import calculate_points

from app.messaging.producer import EventProducer

logger = logging.getLogger(__name__)

class QuizGameService:
    def __init__(
        self,
        session_repo: QuizSessionRepository,
        question_repo: QuestionRepository,
        answer_repo: AnswerRepository,
        event_producer: EventProducer, # Injeção de dependência futura
        quiz_repo: Optional[QuizRepository] = None
    ):
        self.session_repo = session_repo
        self.question_repo = question_repo
        self.answer_repo = answer_repo
        self.event_producer = event_producer
        self.quiz_repo = quiz_repo
    
    async def start_quiz(
        self, 
        user_id: int, 
        quiz_type: str = "general", 
        team_id: Optional[str] = None,
        quiz_id: Optional[str] = None
    ) -> QuizSession:
        active_session = await self.session_repo.get_active_by_user(user_id)
        if active_session:
            raise ValueError("Usuário já possui um quiz ativo")
        
        question_ids: List[str] = []
        
        # Debug: verificar se quiz_id está sendo recebido
        logger.info(f"🔍 DEBUG start_quiz: quiz_id={quiz_id} (tipo: {type(quiz_id)}), quiz_type={quiz_type}, team_id={team_id}")
        
        # Se quiz_id foi fornecido e não for vazio, usar questões do quiz pré-definido
        if quiz_id and isinstance(quiz_id, str) and quiz_id.strip():
            if not self.quiz_repo:
                raise ValueError("QuizRepository não está disponível")
            
            quiz = await self.quiz_repo.get_by_id(quiz_id)
            if not quiz:
                raise ValueError(f"Quiz com ID {quiz_id} não encontrado")
            
            logger.info(f"🔍 Quiz encontrado no banco: {quiz.get('title', 'Sem título')}")
            logger.info(f"🔍 question_ids no banco (tipo: {type(quiz.get('question_ids'))}): {quiz.get('question_ids')}")
            
            question_ids = quiz.get("question_ids", [])
            
            if not question_ids or len(question_ids) == 0:
                logger.error(f"❌ Quiz {quiz_id} não possui questões definidas! question_ids está vazio.")
                raise ValueError(f"Quiz {quiz_id} não possui questões definidas")
            
            # Remover validação de mínimo de 5 questões quando é um quiz específico
            # O usuário pode criar quizzes com qualquer quantidade de questões
            if len(question_ids) < 1:
                raise ValueError("Quiz não possui questões suficientes (mínimo 1)")
            
            # Garantir que os IDs são strings
            question_ids = [str(qid) for qid in question_ids if qid]
            
            logger.info(f"🔍 Quiz encontrado: {quiz.get('title', 'Sem título')} com {len(question_ids)} questões")
            logger.info(f"🔍 Usando quiz pré-definido: {quiz_id} com {len(question_ids)} questões específicas")
            logger.info(f"🔍 IDs das questões completos: {question_ids}")  # Log completo para debug
        else:
            # Lógica original: buscar questões aleatórias
            logger.info(f"🔍 DEBUG: Tentando buscar perguntas aleatórias...")
          
            questions = await self.question_repo.get_random_questions(limit=10, team_id=team_id) #ajustar dps
            
            logger.info(f"🔍 DEBUG: Quantidade encontrada: {len(questions)}")
            logger.info(f"🔍 DEBUG: Conteúdo: {questions}")

            if len(questions) < 5:  #ajustar dps
                logger.error("DEBUG: Entrou no IF de erro!")
                raise ValueError("Não há perguntas suficientes para iniciar o quiz")
            
            question_ids = [str(q.get("id", q.get("_id"))) for q in questions]
        
        session = QuizSession(
            user_id=user_id,
            quiz_type=QuizType(quiz_type), 
            team_id=team_id,
            quiz_id=quiz_id,
            status=QuizStatus.IN_PROGRESS, 
            questions=question_ids,
            started_at=datetime.utcnow()
        )
        
        created_session = await self.session_repo.create(session)
        logger.info(f"✅ Quiz iniciado: user_id={user_id}, session_id={created_session.id}, quiz_id={quiz_id}")

        # try:
        #     if self.event_producer:
        #         await self.event_producer.publish_quiz_created(
        #             exchange_name="quiz_events",
        #             routing_key="game.started", 
        #             message={
        #                 "event_type": "game_started",
        #                 "session_id": str(created_session.id),
        #                 "user_id": user_id,
        #                 "quiz_id": quiz_id,
        #                 "timestamp": str(datetime.utcnow())
        #             }
        #         )
        # except Exception as e:
        #     logger.error(f"Erro ao publicar game.started: {e}")
       

        
        return created_session

    async def submit_answer(
        self, 
        session_id: str, 
        question_id: str, 
        answer_id: str, 
        time_taken_seconds: int
    ) -> dict:
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Sessão não encontrada")
        
        if session.status != QuizStatus.IN_PROGRESS:
            raise ValueError("Quiz já foi finalizado")
        
        # Valida se é a pergunta da vez
        current_q_id = session.questions[session.current_question_index]
        if current_q_id != question_id:
            raise ValueError("Pergunta fora de ordem")
        
        # Busca resposta correta
        answers = await self.answer_repo.get_by_question(question_id)
        correct_answer = next((a for a in answers if a.get("correct") is True), None)
        
        if not correct_answer:
            logger.error(f"Pergunta {question_id} sem resposta correta!")
            raise ValueError("Erro interno: Pergunta sem gabarito")


        is_correct = (answer_id == str(correct_answer["id"]))
        
        # Cálculo de Pontos 

        points = calculate_points(is_correct, time_taken_seconds)
   
        question_answer = QuestionAnswer(
            question_id=question_id,
            selected_answer_id=answer_id,
            is_correct=is_correct,
            time_taken_seconds=time_taken_seconds,
            points_earned=points
        )
        
        session.answers.append(question_answer)
        session.total_points += points
        
        if is_correct:
            session.correct_answers += 1
        else:
            session.wrong_answers += 1
            
        session.current_question_index += 1
        
        # Verifica Fim de Jogo
        is_finished = session.current_question_index >= len(session.questions)
        
        if is_finished:
            await self._finish_quiz(session)
        else:
            await self.session_repo.update(session)
            
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "correct_answer_id": str(correct_answer["id"]), # Front pode mostrar qual era a certa
            "is_quiz_finished": is_finished,
            "new_total_points": session.total_points
        }

    async def _finish_quiz(self, session: QuizSession):
        """Finaliza o quiz e dispara eventos"""
        session.status = QuizStatus.COMPLETED
        session.finished_at = datetime.utcnow()
        session.total_time_seconds = int(
            (session.finished_at - session.started_at).total_seconds()
        )
        
        await self.session_repo.update(session)
        logger.info(f"🏁 Quiz Finalizado: User={session.user_id}, Pontos={session.total_points}")

        #await self.session_repo.update(session)

        # --- PREPARAÇÃO DO PAYLOAD PARA O RABBITMQ ---
        
        # TODO: O ideal seria o front mandar o nome no token ou buscar no user-service.
        # Por enquanto, mandamos um genérico para não quebrar o Ranking.
       
        
        if self.event_producer:
            
            user_display_name = getattr(session, "user_name", f"Jogador #{session.user_id}")

            payload = {
                "user_id": session.user_id,
                "user_name": user_display_name,
                "total_points": session.total_points, 
                "total_time_seconds": session.total_time_seconds,
                "correct_answers": session.correct_answers,
                "total_questions": len(session.questions),
                "finished_at": session.finished_at.isoformat(),
                #"session_id": str(session.id),
                #"quiz_id": str(session.quiz_id) if session.quiz_id else None
            }
            
            try:
                await self.event_producer.publish_game_finished(payload)
                logger.info(f"🚀 Evento game.finished enviado para RabbitMQ (User {session.user_id})")
            except Exception as e:
                # Se falhar o Rabbit, o jogo salvou no banco, mas o ranking desatualizou.
                # Idealmente, teríamos um job de reprocessamento ou log de erro crítico.
                logger.error(f"❌ ERRO CRÍTICO: Falha ao notificar Ranking Service: {e}")
        else:
            logger.error("❌ EventProducer não inicializado! Ranking não será atualizado.")

    async def get_current_quiz(self, user_id: int) -> Optional[dict]:
        session = await self.session_repo.get_active_by_user(user_id)
        if not session:
            return None
        
        # Retornar o formato completo da sessão para compatibilidade com frontend
        session_dict = {
            "id": str(session.id),
            "user_id": session.user_id,
            "quiz_type": session.quiz_type.value if hasattr(session.quiz_type, 'value') else str(session.quiz_type),
            "team_id": session.team_id,
            "quiz_id": str(session.quiz_id) if session.quiz_id else None,
            "status": session.status.value if hasattr(session.status, 'value') else str(session.status),
            "questions": session.questions,
            "current_question_index": session.current_question_index,
            "answers": [
                {
                    "question_id": str(a.question_id),
                    "selected_answer_id": str(a.selected_answer_id),
                    "time_taken_seconds": a.time_taken_seconds,
                    "points_earned": a.points_earned
                } for a in session.answers
            ],
            "total_points": session.total_points,
            "correct_answers": session.correct_answers,
            "wrong_answers": session.wrong_answers,
            "started_at": session.started_at.isoformat() if hasattr(session.started_at, 'isoformat') else str(session.started_at),
            "finished_at": session.finished_at.isoformat() if session.finished_at and hasattr(session.finished_at, 'isoformat') else (str(session.finished_at) if session.finished_at else None),
            "total_time_seconds": session.total_time_seconds
        }
        
        return session_dict
    
    async def abandon_quiz(self, session_id: str) -> QuizSession:
        """
        Marca o quiz como abandonado.
        """
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Sessão não encontrada")
      
        if session.status != QuizStatus.IN_PROGRESS:
            raise ValueError("Este quiz já foi finalizado ou abandonado")
        
        session.status = QuizStatus.ABANDONED
        session.finished_at = datetime.utcnow()
 
        session.total_time_seconds = int(
            (session.finished_at - session.started_at).total_seconds()
        )
   
        await self.session_repo.update(session)
        logger.info(f"⚠️ Quiz abandonado: session_id={session_id}")
        
        return session