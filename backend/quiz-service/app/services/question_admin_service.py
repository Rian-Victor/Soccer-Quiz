import logging
from typing import List
from datetime import datetime
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.schemas.question_schemas import QuestionCreateRequest

logger = logging.getLogger(__name__)

class QuestionAdminService:
    def __init__(self, question_repo: QuestionRepository, answer_repo: AnswerRepository):
        self.question_repo = question_repo
        self.answer_repo = answer_repo

    async def create_full_question(self, data: QuestionCreateRequest):
        """
        Cria uma pergunta e suas respectivas opções de resposta em uma transação lógica.
        """
        
        # 1. Validação Lógica
        if data.correct_option_index < 0 or data.correct_option_index >= len(data.options):
             raise ValueError("O índice da resposta correta é inválido para a lista de opções fornecida.")

        # 2. Prepara e Salva a Pergunta
        # Note que aqui garantimos que team_id seja salvo
        question_doc = {
            "statement": data.statement,
            "difficulty": data.difficulty,
            "team_id": data.team_id,  # Vínculo com o time (pode ser None)
            "created_at": datetime.utcnow()
        }
        
        # O repositório retorna o dict com 'id' convertido
        created_question = await self.question_repo.create(question_doc)
        question_id = created_question["id"]

        # 3. Prepara as Respostas
        answers_docs = []
        for index, option_text in enumerate(data.options):
            answers_docs.append({
                # ATENÇÃO: Usando "questionId" (camelCase) pois é assim que 
                # seu answer_repository.get_by_question busca os dados.
                "questionId": question_id,  
                "text": option_text,
                "correct": (index == data.correct_option_index), # True só na correta
                "team_id": data.team_id # Redundância útil para queries futuras
            })

        # 4. Salva as Respostas em Lote
        await self.answer_repo.create_many(answers_docs)

        logger.info(f"✅ Pergunta criada (ID: {question_id}) com {len(answers_docs)} respostas. Time: {data.team_id}")
        
        return {
            "message": "Pergunta criada com sucesso",
            "question_id": question_id,
            "team_id": data.team_id,
            "options_count": len(answers_docs)
        }