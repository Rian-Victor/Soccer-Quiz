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


router = APIRouter()


# Dependência para obter serviço de usuários
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


# ========== PASSWORD RESET ROUTES ==========

class ForgotPasswordRequest(BaseModel):
    """Schema para requisição de reset de senha"""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Schema de resposta para requisição de reset"""
    message: str
    reset_url_template: str  # Template com placeholder {token}


class ResetPasswordRequest(BaseModel):
    """Schema para validação e reset de senha"""
    token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    """Schema de resposta para reset bem-sucedido"""
    message: str
    user_id: int


@router.post("/password/forgot", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint público - Inicia recuperação de senha
    Gera token único de reset e envia email
    
    Não expõe se o email existe ou não (por segurança)
    """
    from app.repositories.user_repository import UserRepository
    
    repository = UserRepository(db)
    service = UserService(repository, db)
    
    token_result = service.generate_reset_token(request.email)
    
    if token_result:
        token, expires_at = token_result
        # Enviar email (ou tentar usar notification-service)
        reset_url_base = "https://app.example.com/reset-password"  # TODO: usar env var
        await service.send_reset_email(request.email, token, reset_url_base)
    
    # Sempre responder sucesso (por segurança - não expõe se email existe)
    return ForgotPasswordResponse(
        message="Se o email existe na base, você receberá um link para redefinir a senha",
        reset_url_template="https://app.example.com/reset-password?token={token}"  # TODO: usar env var
    )


@router.post("/password/reset", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint público - Redefine a senha usando token
    Token é único, de uso único, curto e expira em 15 minutos
    """
    from app.repositories.user_repository import UserRepository
    
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no mínimo 8 caracteres"
        )
    
    repository = UserRepository(db)
    service = UserService(repository, db)
    
    user = service.reset_password(request.token, request.new_password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido, expirado ou já utilizado"
        )
    
    return ResetPasswordResponse(
        message="Senha redefinida com sucesso",
        user_id=user.id
    )


@router.get("/password/validate-token")
async def validate_token(
    token: str = Query(..., description="Token de reset a validar"),
    db: Session = Depends(get_db)
):
    """
    Endpoint público - Valida um token de reset
    Útil para verificar no front-end se o token é válido antes de exibir form
    """
    from app.repositories.user_repository import UserRepository
    
    repository = UserRepository(db)
    service = UserService(repository, db)
    
    user = service.validate_reset_token(token)
    
    if not user:
        return {"valid": False, "message": "Token inválido, expirado ou já utilizado"}
    
    return {
        "valid": True,
        "message": "Token válido",
        "user_id": user.id,
        "email": user.email
    }
