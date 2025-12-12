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
from app.database import get_db
from app.models import RefreshToken, PasswordResetToken


router = APIRouter()

# Instâncias de serviços 
jwt_service = JwtService()
user_service_client = UserServiceClient()
auth_service = AuthService(jwt_service, user_service_client)


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

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependency para obter AuthService com db injetado"""
    jwt_service = JwtService()
    user_service_client = UserServiceClient()
    return AuthService(jwt_service, user_service_client, db)


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
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
        db=auth_service.db
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
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Realiza logout do usuário
    
    Remove o refresh token do banco de dados
    """
    success = auth_service.logout(request.refresh_token, auth_service.db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token não encontrado"
        )
    
    return LogoutResponse(message="Logout realizado com sucesso")


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)  # 👈 INJETAR
):
    """
    Renova o access token usando o refresh token
    """
    result = auth_service.refresh_access_token(request.refresh_token, auth_service.db)
    
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

@router.delete("/users/{user_id}/tokens")
async def cleanup_user_tokens(user_id: int, db: Session = Depends(get_db)):
    """Endpoint interno - Limpa tokens de um usuário deletado"""
   
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id
    ).delete()
    
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id
    ).delete()
    
    db.commit()
    
    return {"message": f"Tokens do usuário {user_id} removidos"}


# ========== PASSWORD RESET ROUTES ==========

class ForgotPasswordRequest(BaseModel):
    """Schema para requisição de reset de senha"""
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Schema de resposta para requisição de reset"""
    message: str
    

class ResetPasswordRequest(BaseModel):
    """Schema para validação e reset de senha"""
    token: str
    new_password: str


class ResetPasswordResponse(BaseModel):
    """Schema de resposta para reset bem-sucedido"""
    message: str


@router.post("/password/forgot", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service)  
):
    """
    Endpoint público - Inicia recuperação de senha
    Delega para o AuthService que vai falar com User Service e RabbitMQ
    """

    await auth_service.forgot_password(request.email)
    
    return ForgotPasswordResponse(
        message="Se o email existe na base, você receberá um link para redefinir a senha",
        reset_url_template=f"{settings.FRONTEND_URL}/reset-password?token={{token}}"
    )


@router.post("/password/reset", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_auth_service) 
):
    """
    Endpoint público - Redefine a senha usando token
    """
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha deve ter no mínimo 8 caracteres"
        )
    
    
    await auth_service.reset_password(request.token, request.new_password, auth_service.db)
    
    return ResetPasswordResponse(
        message="Senha redefinida com sucesso"
    )


@router.get("/password/validate-token")
async def validate_token(
    token: str,
    auth_service: AuthService = Depends(get_auth_service) 
):
    """
    Endpoint público - Valida um token de reset
    """
    
    is_valid = auth_service.validate_reset_token(token, auth_service.db)
    
    if not is_valid:
        return {"valid": False, "message": "Token inválido ou expirado"}
    
    return {"valid": True, "message": "Token válido"}

