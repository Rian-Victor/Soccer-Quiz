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
            "created_at": datetime.utcnow()
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
        
        return {
            "message": "Pergunta criada com sucesso",
            "question_id": question_id,
            "question": created_question # Retorna o objeto completo
        }