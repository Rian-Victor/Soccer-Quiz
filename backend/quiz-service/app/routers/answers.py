"""
Rotas de Answers
CRUD de respostas
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from app.database import get_database
from app.dependencies import get_answer_repo

from app.repositories.answer_repository import AnswerRepository
#from app.interfaces.repositories import IAnswerRepository


router = APIRouter()


# Schemas Pydantic
class AnswerCreate(BaseModel):
    """Schema para criação de resposta"""
    text: str  
    correct: bool 
    questionId: str  


class AnswerUpdate(BaseModel):
    """Schema para atualização de resposta"""
    text: Optional[str] = None
    correct: Optional[bool] = None
    questionId: Optional[str] = None


class AnswerResponse(BaseModel):
    """Schema de resposta de resposta"""
    id: str
    text: str
    correct: bool
    questionId: str
    
    class Config:
        from_attributes = True


@router.post("", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    answer_data: AnswerCreate,
    repository: AnswerRepository = Depends(get_answer_repo)
):
    """Cria uma nova resposta (apenas admin)"""
    answer_dict = answer_data.model_dump()
    answer = await repository.create(answer_dict)
    return AnswerResponse(**answer)


@router.get("", response_model=List[AnswerResponse])
async def get_answers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    question_id: Optional[str] = Query(None),
    repository: AnswerRepository = Depends(get_answer_repo)
):
    """Lista todas as respostas (apenas admin) - opcionalmente filtradas por question_id"""
    answers = await repository.get_all(skip=skip, limit=limit, question_id=question_id)
    return [AnswerResponse(**answer) for answer in answers]


# @router.get("/{answer_id}", response_model=AnswerResponse)
# async def get_answer(
#     answer_id: str,
#     repository: IAnswerRepository = Depends(get_answer_repository)
# ):
#     """Busca uma resposta por ID (apenas admin)"""
#     answer = await repository.get_by_id(answer_id)
#     if not answer:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Resposta com ID {answer_id} não encontrada"
#         )
#     return AnswerResponse(**answer)


# @router.patch("/{answer_id}", response_model=AnswerResponse)
# async def update_answer(
#     answer_id: str,
#     answer_data: AnswerUpdate,
#     repository: IAnswerRepository = Depends(get_answer_repository)
# ):
#     """Atualiza uma resposta (apenas admin)"""
#     update_dict = answer_data.model_dump(exclude_none=True)
#     answer = await repository.update(answer_id, update_dict)
#     if not answer:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Resposta com ID {answer_id} não encontrada"
#         )
#     return AnswerResponse(**answer)


@router.delete("/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_answer(
    answer_id: str,
    repository: AnswerRepository = Depends(get_answer_repo)
):
    success = await repository.delete(answer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")