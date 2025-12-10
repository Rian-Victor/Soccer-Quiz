"""
Serviço de autenticação
Refatorado para usar UserServiceClient
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
import secrets
import logging

from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import RefreshToken, PasswordResetToken
from app.services.jwt_service import JwtService
from app.services.user_service import UserServiceClient
from app.messaging.rabbitmq_producer import RabbitMQProducer
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

class AuthService:
    """Serviço para gerenciar autenticação"""
    
    def __init__(self, jwt_service: JwtService, user_service_client: UserServiceClient, db: Session = None):
        self.jwt_service = jwt_service
        self.user_service_client = user_service_client
        self.db = db
    
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
    
    # ==========================================================
    # RECUPERAÇÃO DE SENHA 
    # ==========================================================
    
    async def forgot_password(self, email: str):
        if not self.db:
            raise RuntimeError("Database session não disponível")

        user_data = await self.user_service_client.get_user_by_email(email)

        if not user_data:
            logger.info(f"Email não encontrado: {email}")
            return 

        # Gerar Token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        
        reset_token = PasswordResetToken(
            user_id=user_data.id, 
            token=token,
            expires_at=expires_at
        )
        
        self.db.add(reset_token)
        self.db.commit()

        # Publicar no RabbitMQ
        #reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
    
        user_name = getattr(user_data, 'name', 'Usuário')

        try:
            producer = RabbitMQProducer()
            await producer.publish_password_reset(
                email=email,
                token=token, 
                user_name=user_name
            )
            logger.info(f"✅ Evento de reset enviado para {email}")
        except Exception as e:
            logger.error(f"⚠️ Falha ao publicar no RabbitMQ: {e}")

        
        return True

    def validate_reset_token(self, token: str, db: Session) -> bool:
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        if not reset_token or reset_token.used or datetime.utcnow() > reset_token.expires_at:
            return False
        return True

    async def reset_password(self, token: str, new_password: str, db: Session):
        # 1. Validar Token
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).with_for_update().first()
        
        if not reset_token or reset_token.used or datetime.utcnow() > reset_token.expires_at:
             raise HTTPException(status_code=400, detail="Token inválido ou expirado")

        # 2. Hash da senha
        new_password_hash = self.hash_password(new_password)
        
        # 3. Usar o Client para atualizar a senha (Abstração limpa)
        success = await self.user_service_client.update_password(
            user_id=reset_token.user_id, 
            new_password_hash=new_password_hash
        )
        
        if not success:
            raise HTTPException(status_code=503, detail="Erro ao atualizar senha no serviço de usuários")

        # 4. Invalidar token
        reset_token.used = True
        reset_token.used_at = datetime.utcnow()
        db.add(reset_token)
        db.commit()
        
        return True