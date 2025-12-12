"""
Rotas de usuários
CRUD de usuários
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from enum import Enum

from app.database import get_db
from app.models import User, UserRole
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository

# ISP: este router expõe somente as rotas de usuários, mantendo as demais responsabilidades separadas.
router = APIRouter()


# DIP: injetamos o repositório no serviço para manter o router dependente de abstrações.
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    """Dependência para obter serviço de usuários"""
    repository = UserRepository(db)
    return UserService(repository, db)


# Schemas Pydantic
class UserRoleEnum(str, Enum):
    """Enum de roles de usuário"""
    admin = "admin"
    comum = "comum"


class UserCreate(BaseModel):
    """Schema para criação de usuário"""
    name: str
    email: EmailStr
    password: str
    role: UserRoleEnum = UserRoleEnum.comum


class UserUpdate(BaseModel):
    """Schema para atualização de usuário"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRoleEnum] = None


class UserResponse(BaseModel):
    """Schema de resposta de usuário (público)"""
    id: int
    name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True


class UserInternalResponse(BaseModel):
    """Schema de resposta interna (apenas id, email, passwordHash, role)"""
    id: int
    email: str
    passwordHash: str
    role: str
    
    class Config:
        from_attributes = True

class InternalPasswordUpdateRequest(BaseModel):
    """Schema para atualização interna de senha (recebe o hash pronto)"""
    password_hash: str


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """
    Cria um novo usuário (apenas admin)
    """
    try:
        role = UserRole.ADMIN if user_data.role == UserRoleEnum.admin else UserRole.COMUM
        user = user_service.create_user(
            name=user_data.name,
            email=user_data.email,
            password=user_data.password,
            role=role.value
        )
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    user_service: UserService = Depends(get_user_service)
):
    """
    Lista todos os usuários (apenas admin)
    """
    users = user_service.get_all_users(skip=skip, limit=limit)
    return [
        UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role
        )
        for user in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    """
    Busca um usuário por ID (apenas admin)
    """
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado"
        )
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    user_service: UserService = Depends(get_user_service)
):
    """
    Atualiza um usuário (apenas admin)
    """
    try:
        role = None
        if user_data.role:
            role = UserRole.ADMIN if user_data.role == UserRoleEnum.admin else UserRole.COMUM
            role = role.value
        
        user = user_service.update_user(
            user_id=user_id,
            name=user_data.name,
            email=user_data.email,
            password=user_data.password,
            role=role
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuário com ID {user_id} não encontrado"
            )
        
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    """
    Deleta um usuário (apenas admin)
    """
    success = user_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado"
        )


# Endpoint interno - usado apenas pelo auth-service
@router.get("/internal/by-email", response_model=UserInternalResponse)
async def get_user_by_email_internal(
    email: str = Query(..., description="Email do usuário"),
    user_service: UserService = Depends(get_user_service)
):
    """
    Endpoint interno - busca usuário por email
    Usado exclusivamente pelo auth-service durante o login
    
    Retorna apenas: id, email, passwordHash, role
    """
    user = user_service.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com email {email} não encontrado"
        )
    
    return UserInternalResponse(
        id=user.id,
        email=user.email,
        passwordHash=user.password_hash,
        role=user.role
    )


@router.patch("/internal/{user_id}/password", status_code=status.HTTP_200_OK)
async def update_user_password_internal(
    user_id: int,
    request: InternalPasswordUpdateRequest,
    user_service: UserService = Depends(get_user_service)
):
    """
    Endpoint interno - Atualiza apenas o hash da senha.
    Chamado pelo auth-service após validação do token.
    Recebe o hash JÁ PRONTO. Não deve hashear novamente.
    """
    success = user_service.update_password_hash(user_id, request.password_hash)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado ou erro ao atualizar"
        )
    
    return {"message": "Senha atualizada com sucesso"}