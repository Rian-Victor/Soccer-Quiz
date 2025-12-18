import logging
from typing import List, Optional
from datetime import datetime, timezone
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.quiz_repository import QuizRepository
from app.repositories.team_repository import TeamRepository
from app.schemas.question_schemas import QuestionCreateRequest

logger = logging.getLogger(__name__)

class QuestionAdminService:
    def __init__(
        self, 
        question_repo: QuestionRepository, 
        answer_repo: AnswerRepository,
        quiz_repo: Optional[QuizRepository] = None,
        team_repo: Optional[TeamRepository] = None
    ):
        self.question_repo = question_repo
        self.answer_repo = answer_repo
        self.quiz_repo = quiz_repo
        self.team_repo = team_repo

    async def create_full_question(self, data: QuestionCreateRequest):
        """
        Cria uma pergunta e suas respectivas opções de resposta.
        CORREÇÃO: Agora salva as 'options' dentro da pergunta também para facilitar o GET.
        """
        
        # 1. Validação Lógica
        if data.correct_option_index < 0 or data.correct_option_index >= len(data.options):
             raise ValueError("O índice da resposta correta é inválido.")

        # 2. Prepara e Salva a Pergunta
        # AQUI ESTÁ A MUDANÇA: Adicionamos 'options' e 'correct_option_index' no dicionário
        question_doc = {
            "statement": data.statement,
            "difficulty": data.difficulty,
            "topic": data.topic, # Adicionei o Topic
            "team_id": data.team_id,
            "options": data.options, # <--- O PULO DO GATO: Salvando a lista aqui!
            "correct_option_index": data.correct_option_index, # Salvando o índice
            "created_at": datetime.now(timezone.utc)
        }
        
        # O repositório retorna o dict com 'id' convertido
        created_question = await self.question_repo.create(question_doc)
        question_id = created_question["id"]

        # 3. Prepara as Respostas (Tabela 'answers' - mantida para o gameplay funcionar)
        answers_docs = []
        for index, option_text in enumerate(data.options):
            answers_docs.append({
                "questionId": question_id,  
                "text": option_text,
                "correct": (index == data.correct_option_index),
                "team_id": data.team_id
            })

        # 4. Salva as Respostas em Lote
        await self.answer_repo.create_many(answers_docs)

        logger.info(f"✅ Pergunta criada (ID: {question_id}) com opções integradas.")
        
        # 5. Se a pergunta está associada a um time, criar/atualizar quiz automaticamente
        if data.team_id and self.quiz_repo and self.team_repo:
            try:
                # Verificar se o time existe
                team = await self.team_repo.get_by_id(data.team_id)
                if not team:
                    logger.warning(f"⚠️ Time com ID {data.team_id} não encontrado. Quiz não será criado.")
                else:
                    # Buscar quiz existente para este time
                    existing_quiz = await self.quiz_repo.get_by_team_id(data.team_id)
                    
                    if existing_quiz:
                        # Atualizar quiz existente: adicionar a nova pergunta
                        current_question_ids = existing_quiz.get("question_ids", [])
                        if question_id not in current_question_ids:
                            current_question_ids.append(question_id)
                            await self.quiz_repo.update(
                                existing_quiz["id"],
                                {"question_ids": current_question_ids}
                            )
                            logger.info(f"✅ Quiz do time {data.team_id} atualizado com a nova pergunta.")
                    else:
                        # Criar novo quiz para o time
                        quiz_dict = {
                            "title": f"Quiz - {team.get('name', 'Time')}",
                            "description": f"Quiz automático com perguntas do time {team.get('name', '')}",
                            "question_ids": [question_id],
                            "team_id": data.team_id,
                            "created_at": datetime.now(timezone.utc),
                            "created_by": 0  # Sistema
                        }
                        new_quiz = await self.quiz_repo.create(quiz_dict)
                        logger.info(f"✅ Quiz criado automaticamente para o time {data.team_id} (Quiz ID: {new_quiz.get('id')}).")
            except Exception as e:
                logger.error(f"❌ Erro ao criar/atualizar quiz para time {data.team_id}: {e}")
                # Não falha a criação da pergunta se houver erro no quiz
        
        return {
            "message": "Pergunta criada com sucesso",
            "question_id": question_id,
            "question": created_question # Retorna o objeto completo
        }