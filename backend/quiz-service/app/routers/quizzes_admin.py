"""
Rotas de Quizzes (Admin)
CRUD de quizzes pré-definidos
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from typing import Optional
from datetime import datetime, timezone

from app.database import get_database
from app.repositories.quiz_repository import QuizRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.quiz_schemas import QuizCreate, QuizUpdate, QuizDB
from app.dependencies import require_admin_role

router = APIRouter(prefix="/quizzes-admin", tags=["quizzes-admin"])


def get_quiz_repo(db=Depends(get_database)) -> QuizRepository:
    return QuizRepository(db)


def get_question_repo(db=Depends(get_database)) -> QuestionRepository:
    return QuestionRepository(db)


async def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> int:
    """Extrai o ID do usuário do header"""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User ID format")


@router.post("", response_model=QuizDB, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    repository: QuizRepository = Depends(get_quiz_repo),
    question_repo: QuestionRepository = Depends(get_question_repo),
    user_id: int = Depends(get_current_user_id),
    _admin_role: str = Depends(require_admin_role)
):
    """Cria um novo quiz (apenas admin)"""
    # Validar que todas as questões existem
    for question_id in quiz_data.question_ids:
        question = await question_repo.get_by_id(question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Questão com ID {question_id} não encontrada"
            )
    
    quiz_dict = {
        "title": quiz_data.title,
        "description": quiz_data.description,
        "question_ids": quiz_data.question_ids,
        "created_at": datetime.now(timezone.utc),
        "created_by": user_id
    }
    
    quiz = await repository.create(quiz_dict)
    return QuizDB(**quiz)


@router.get("", response_model=List[QuizDB])
async def get_quizzes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    repository: QuizRepository = Depends(get_quiz_repo)
):
    """Lista todos os quizzes"""
    quizzes = await repository.get_all(skip=skip, limit=limit)
    return [QuizDB(**quiz) for quiz in quizzes]


@router.get("/{quiz_id}", response_model=QuizDB)
async def get_quiz(
    quiz_id: str,
    repository: QuizRepository = Depends(get_quiz_repo)
):
    """Busca um quiz por ID"""
    quiz = await repository.get_by_id(quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz com ID {quiz_id} não encontrado"
        )
    return QuizDB(**quiz)


@router.patch("/{quiz_id}", response_model=QuizDB)
async def update_quiz(
    quiz_id: str,
    quiz_data: QuizUpdate,
    repository: QuizRepository = Depends(get_quiz_repo),
    question_repo: QuestionRepository = Depends(get_question_repo),
    _admin_role: str = Depends(require_admin_role)
):
    """Atualiza um quiz (apenas admin)"""
    # Validar que o quiz existe
    existing_quiz = await repository.get_by_id(quiz_id)
    if not existing_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz com ID {quiz_id} não encontrado"
        )
    
    # Se question_ids foi fornecido, validar que todas existem
    if quiz_data.question_ids is not None:
        for question_id in quiz_data.question_ids:
            question = await question_repo.get_by_id(question_id)
            if not question:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Questão com ID {question_id} não encontrada"
                )
    
    update_dict = quiz_data.model_dump(exclude_none=True)
    quiz = await repository.update(quiz_id, update_dict)
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz com ID {quiz_id} não encontrado"
        )
    
    return QuizDB(**quiz)


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: str,
    repository: QuizRepository = Depends(get_quiz_repo),
    _admin_role: str = Depends(require_admin_role)
):
    """Deleta um quiz (apenas admin)"""
    success = await repository.delete(quiz_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz com ID {quiz_id} não encontrado"
        )

