"""
Serviço de autenticação
Gerencia login, logout e tokens
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models import RefreshToken
from app.services.jwt_service import JwtService
from app.config import settings

# Contexto para hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Serviço para gerenciar autenticação"""
    
    def __init__(self, jwt_service: JwtService):
        self.jwt_service = jwt_service
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verifica se a senha está correta
        
        Args:
            plain_password: Senha em texto plano
            hashed_password: Hash da senha
            
        Returns:
            True se a senha estiver correta, False caso contrário
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    def login(
        self,
        user_id: int,
        user_email: str,
        user_role: str,
        db: Session
    ) -> Tuple[str, str, datetime]:
        """
        Realiza login e gera tokens
        
        Args:
            user_id: ID do usuário
            user_email: Email do usuário
            user_role: Role do usuário (admin/comum)
            db: Sessão do banco de dados
            
        Returns:
            Tupla com (access_token, refresh_token, expires_at)
        """
        # Criar access token
        access_token = self.jwt_service.create_access_token(
            data={
                "sub": str(user_id),
                "userId": user_id,
                "email": user_email,
                "role": user_role
            }
        )
        
        # Criar refresh token
        refresh_token = self.jwt_service.create_refresh_token(
            data={"sub": str(user_id), "userId": user_id}
        )
        
        # Calcular data de expiração do refresh token
        expires_at = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Salvar refresh token no banco
        db_refresh_token = RefreshToken(
            token=refresh_token,
            user_id=user_id,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()
        db.refresh(db_refresh_token)
        
        return access_token, refresh_token, expires_at
    
    def logout(self, refresh_token: str, db: Session) -> bool:
        """
        Realiza logout removendo o refresh token
        
        Args:
            refresh_token: Token de refresh a ser removido
            db: Sessão do banco de dados
            
        Returns:
            True se o logout foi bem-sucedido, False caso contrário
        """
        db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        
        if db_token:
            db.delete(db_token)
            db.commit()
            return True
        
        return False
    
    def refresh_access_token(self, refresh_token: str, db: Session) -> Optional[Tuple[str, str, datetime]]:
        """
        Gera um novo access token usando o refresh token
        
        Args:
            refresh_token: Token de refresh
            db: Sessão do banco de dados
            
        Returns:
            Tupla com (access_token, refresh_token, expires_at) ou None se inválido
        """
        # Verificar se o token é válido
        payload = self.jwt_service.verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        # Verificar se o token existe no banco e não expirou
        db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if not db_token or db_token.expires_at < datetime.utcnow():
            return None
        
        user_id = int(payload.get("userId") or payload.get("sub"))
        
        # Gerar novo access token (mantém o mesmo refresh token)
        access_token = self.jwt_service.create_access_token(
            data={
                "sub": str(user_id),
                "userId": user_id,
                "role": payload.get("role", "comum")
            }
        )
        
        return access_token, refresh_token, db_token.expires_at

