"""
Rotas de autenticação
Login e logout
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.services.auth_service import AuthService
from app.services.jwt_service import JwtService
from app.services.user_service import UserServiceClient
from app.config import settings

router = APIRouter()

# Instâncias de serviços (em produção, usar dependency injection)
jwt_service = JwtService()
auth_service = AuthService(jwt_service)
user_service_client = UserServiceClient()


class LoginRequest(BaseModel):
    """Modelo de requisição de login"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Modelo de resposta de login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: str
    user_id: int
    role: str


class LogoutRequest(BaseModel):
    """Modelo de requisição de logout"""
    refresh_token: str


class LogoutResponse(BaseModel):
    """Modelo de resposta de logout"""
    message: str


class RefreshTokenRequest(BaseModel):
    """Modelo de requisição de refresh token"""
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Modelo de resposta de refresh token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: str


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Realiza login do usuário
    
    Fluxo:
    1. Busca usuário no user-service pelo email
    2. Verifica senha usando bcrypt
    3. Gera access token e refresh token
    4. Armazena refresh token no banco
    """
    # Buscar usuário no user-service
    user_data = await user_service_client.get_user_by_email(request.email)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Verificar senha
    if not auth_service.verify_password(request.password, user_data.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Realizar login (gerar tokens)
    access_token, refresh_token, expires_at = auth_service.login(
        user_id=user_data.id,
        user_email=user_data.email,
        user_role=user_data.role,
        db=db
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_at=expires_at.isoformat(),
        user_id=user_data.id,
        role=user_data.role
    )


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    request: LogoutRequest,
    db: Session = Depends(get_db)
):
    """
    Realiza logout do usuário
    
    Remove o refresh token do banco de dados
    """
    success = auth_service.logout(request.refresh_token, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token não encontrado"
        )
    
    return LogoutResponse(message="Logout realizado com sucesso")


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Renova o access token usando o refresh token
    """
    result = auth_service.refresh_access_token(request.refresh_token, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
    
    access_token, refresh_token, expires_at = result
    
    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_at=expires_at.isoformat()
    )

