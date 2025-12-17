# app/dependencies.py
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status, Header
from typing import Optional

# Importa as globais que você já tem
from app.database import get_database # <--- ASSUMINDO que você tem uma função que retorna o banco conectado
from app.messaging.producer import event_producer

# Repositórios
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.repositories.quiz_session_repository import QuizSessionRepository
from app.repositories.team_repository import TeamRepository
from app.repositories.quiz_repository import QuizRepository

# Serviços
from app.services.quiz_game_service import QuizGameService
from app.services.question_admin_service import QuestionAdminService
from app.messaging.producer import EventProducer

# ------------------------------------------------------------------
# FÁBRICAS (Dependency Injection)
# ------------------------------------------------------------------


async def require_admin_role(
        x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> str:
    """
    Dependência para validar que o usuário tem role de admin.
    O API Gateway valida o JWT e injeta este Header.

    Raises:
        HTTPException: 403 se o role não for "admin"
    """
    if not x_user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: role não fornecido"
        )

    if x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: apenas administradores podem realizar esta ação"
        )

    return x_user_role
# 1. Banco de Dados
# O FastAPI vai resolver isso usando a função do seu app.database
async def get_db_conn() -> AsyncIOMotorDatabase:
    return get_database()

# 2. RabbitMQ Producer
# Retorna a instância global que foi conectada no lifespan do main.py
def get_event_producer_instance() -> EventProducer:
    return event_producer

# 3. Repositorios
def get_question_repo(db=Depends(get_db_conn)) -> QuestionRepository:
    return QuestionRepository(db)

def get_answer_repo(db=Depends(get_db_conn)) -> AnswerRepository:
    return AnswerRepository(db)

def get_session_repo(db=Depends(get_db_conn)) -> QuizSessionRepository:
    return QuizSessionRepository(db)

def get_team_repo(db=Depends(get_db_conn)) -> TeamRepository:
    return TeamRepository(db)

def get_quiz_repo(db=Depends(get_db_conn)) -> QuizRepository:
    return QuizRepository(db)

# 4. Serviços (AQUI LIMPA AS ROTAS)
def get_question_admin_service(
    q_repo=Depends(get_question_repo),
    a_repo=Depends(get_answer_repo),
    quiz_repo=Depends(get_quiz_repo),
    team_repo=Depends(get_team_repo)
) -> QuestionAdminService:
    return QuestionAdminService(q_repo, a_repo, quiz_repo, team_repo)

def get_quiz_game_service(
    s_repo=Depends(get_session_repo),
    q_repo=Depends(get_question_repo),
    a_repo=Depends(get_answer_repo),
    producer=Depends(get_event_producer_instance),
    quiz_repo=Depends(get_quiz_repo)
) -> QuizGameService:
    return QuizGameService(s_repo, q_repo, a_repo, producer, quiz_repo)