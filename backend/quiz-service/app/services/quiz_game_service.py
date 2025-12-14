from typing import List, Optional
from datetime import datetime
import logging

from app.repositories.quiz_session_repository import QuizSessionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository

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
        event_producer: EventProducer # Injeção de dependência futura
    ):
        self.session_repo = session_repo
        self.question_repo = question_repo
        self.answer_repo = answer_repo
        self.event_producer = event_producer
    
    async def start_quiz(
        self, 
        user_id: int, 
        quiz_type: str = "general", 
        team_id: Optional[str] = None
    ) -> QuizSession:
        active_session = await self.session_repo.get_active_by_user(user_id)
        if active_session:
            raise ValueError("Usuário já possui um quiz ativo")
        
        logger.info(f"🔍 DEBUG: Tentando buscar perguntas...")
      
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
            status=QuizStatus.IN_PROGRESS, 
            questions=question_ids,
            started_at=datetime.utcnow()
        )
        
        created_session = await self.session_repo.create(session)
        logger.info(f"✅ Quiz iniciado: user_id={user_id}, session_id={created_session.id}")
        
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
        user_display_name = f"Jogador #{session.user_id}"
    
        payload = {
            "session_id": str(session.id),
            "user_id": session.user_id, 
            "user_name": user_display_name,
            "total_points": session.total_points,
            "total_time_seconds": session.total_time_seconds,
            "finished_at": session.finished_at.isoformat(),
            "correct_answers": session.correct_answers,
            "total_questions": len(session.questions)
        }
        
        if self.event_producer:
            await self.event_producer.publish_game_finished(payload)
        else:
            logger.error("❌ EventProducer não inicializado! Ranking não será atualizado.")


    async def get_current_quiz(self, user_id: int) -> Optional[dict]:
        session = await self.session_repo.get_active_by_user(user_id)
        if not session:
            return None
            
        current_q_id = session.questions[session.current_question_index]
        question = await self.question_repo.get_by_id(current_q_id)
        answers = await self.answer_repo.get_by_question(current_q_id)

        answers_data = [
            {"id": str(a["id"]), "text": a["text"]} for a in answers
        ]
        
        return {
            "session_id": str(session.id),
            "progress": f"{session.current_question_index + 1}/{len(session.questions)}",
            "current_question": {
                "id": str(question["id"]),
                "statement": question["statement"],
                "topic": getattr(question, "topic", "Geral"), 
                "answers": answers_data
            }
        }
    
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