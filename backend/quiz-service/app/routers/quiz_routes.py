from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional

from app.database import get_database
from app.repositories.quiz_session_repository import QuizSessionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.answer_repository import AnswerRepository
from app.services.quiz_game_service import QuizGameService
from app.schemas.quiz_dtos import StartQuizRequest, SubmitAnswerRequest 
from app.dependencies import get_quiz_game_service
from app.messaging.producer import event_producer

router = APIRouter(prefix="/quizzes", tags=["gameplay"])


def get_quiz_service(db = Depends(get_database)) -> QuizGameService:
    session_repo = QuizSessionRepository(db)
    question_repo = QuestionRepository(db)
    answer_repo = AnswerRepository(db)
    return QuizGameService(session_repo, question_repo, answer_repo, event_producer)

async def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> int:
    """
    Simula a extração do ID do usuário vinda do API Gateway.
    O Gateway valida o JWT e injeta este Header.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID format")


@router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_quiz(
    request: StartQuizRequest,
    user_id: int = Depends(get_current_user_id),
    service: QuizGameService = Depends(get_quiz_game_service)
):
    """
    Inicia um novo quiz (REQ 06)
    """
    try:
        session = await service.start_quiz(
            user_id=user_id,
            quiz_type=request.quiz_type,
            team_id=request.team_id
        )
     
        current_quiz = await service.get_current_quiz(user_id)
        
        return {
            "message": "Quiz iniciado com sucesso",
            "session_id": str(session.id),
            "quiz": current_quiz
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/current")
async def get_current_quiz(
    user_id: int = Depends(get_current_user_id),
    service: QuizGameService = Depends(get_quiz_game_service)
):
    """
    Retorna o quiz ativo do usuário ou 404
    """
    quiz = await service.get_current_quiz(user_id)
    
    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Nenhum quiz ativo encontrado"
        )
    
    return quiz

@router.post("/answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    user_id: int = Depends(get_current_user_id),
    service: QuizGameService = Depends(get_quiz_game_service)
):
    """
    Submete resposta de uma pergunta
    """
    try:
        result = await service.submit_answer(
            session_id=request.session_id,
            question_id=request.question_id,
            answer_id=request.answer_id,
            time_taken_seconds=request.time_taken_seconds
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/abandon/{session_id}")
async def abandon_quiz(
    session_id: str,
    user_id: int = Depends(get_current_user_id),
    service: QuizGameService = Depends(get_quiz_game_service)
):
    """
    Usuário desiste do quiz (REQ 07)
    """
    try:
        session = await service.abandon_quiz(session_id)
        
        return {
            "message": "Quiz abandonado",
            "total_points": session.total_points,
            "questions_answered": len(session.answers)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))