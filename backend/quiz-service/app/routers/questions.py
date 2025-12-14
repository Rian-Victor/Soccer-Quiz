"""
Rotas de Questions
CRUD de perguntas
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from app.database import get_database
from app.schemas.question_schemas import QuestionCreateRequest, QuestionDB, QuestionBase
from app.dependencies import get_question_admin_service, get_question_repo

from app.repositories.question_repository import QuestionRepository
from app.services.question_admin_service import QuestionAdminService
#from app.interfaces.repositories import IQuestionRepository


router = APIRouter()


# Schemas Pydantic
class QuestionCreate(BaseModel):
    """Schema para criação de pergunta"""
    statement: str  # Enunciado
    topic: str  
    difficulty: str  # Dificuldade (ex: "easy", "medium", "hard")


class QuestionUpdate(BaseModel):
    """Schema para atualização de pergunta"""
    statement: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class QuestionResponse(BaseModel):
    """Schema de resposta de pergunta"""
    id: str
    statement: str
    topic: str
    difficulty: str
    
    class Config:
        from_attributes = True


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionCreateRequest,
    service: QuestionAdminService = Depends(get_question_admin_service)
):
    """Cria uma nova pergunta (apenas admin)"""
    return await service.create_full_question(payload)


@router.get("", response_model=List[QuestionDB])
async def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    repository: QuestionRepository = Depends(get_question_repo)
):
    """Lista todas as perguntas (apenas admin)"""
    return await repository.get_all(skip=skip, limit=limit)

@router.get("/{question_id}", response_model=QuestionDB)
async def get_question(
    question_id: str,
    repository: QuestionRepository = Depends(get_question_repo)
):
    """Busca uma pergunta por ID (apenas admin)"""
    question = await repository.get_by_id(question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pergunta com ID {question_id} não encontrada"
        )
    return question


# @router.patch("/{question_id}", response_model=QuestionResponse)
# async def update_question(
#     question_id: str,
#     question_data: QuestionUpdate,
#     repository: IQuestionRepository = Depends(get_question_repository)
# ):
#     """Atualiza uma pergunta (apenas admin)"""
#     update_dict = question_data.model_dump(exclude_none=True)
#     question = await repository.update(question_id, update_dict)
#     if not question:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Pergunta com ID {question_id} não encontrada"
#         )
#     return QuestionResponse(**question)


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: str,
    repository: QuestionRepository = Depends(get_question_repo)
):
    """Deleta uma pergunta (apenas admin)"""
    success = await repository.delete(question_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pergunta com ID {question_id} não encontrada"
        )

