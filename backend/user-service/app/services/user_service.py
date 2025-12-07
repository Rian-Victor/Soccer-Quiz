"""
Serviço de usuários
Gerencia CRUD de usuários e lógica de domínio
"""
from typing import Optional, List, Tuple
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import logging
import asyncio

from app.models import User, UserRole, PasswordResetToken
from app.interfaces.user_repository import IUserRepository
# 👇 Import correto do arquivo que acabamos de criar
from app.producers import RabbitMQProducer 
from app.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """Serviço para gerenciar usuários"""
    
    def __init__(self, repository: IUserRepository, db: Session = None):
        self.repository = repository
        self.db = db
    
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_user(self, name: str, email: str, password: str, role: UserRole = UserRole.COMUM) -> User:
        existing_user = self.repository.get_by_email(email)
        if existing_user:
            raise ValueError(f"Email {email} já está em uso")
        
        password_hash = self.hash_password(password)
        
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role.value if hasattr(role, 'value') else role
        )
        created_user = self.repository.create(user)
        print(f"DEBUG 1: Usuário {created_user.email} salvo no DB. Preparando envio...", flush=True)

        try:
            from app.config import settings
            print(f"DEBUG 2: URL RabbitMQ usada: {settings.RABBITMQ_URL}", flush=True)

            producer = RabbitMQProducer()
            print("DEBUG 3: Producer instanciado. Tentando publicar...", flush=True)

            producer.publish_user_registered(created_user.email, created_user.name)
            print("DEBUG 4: MENSAGEM ENVIADA COM SUCESSO!", flush=True)

        except Exception as e:
            # Isso vai pegar qualquer erro de conexão ou código
            print(f"DEBUG ERRO CRÍTICO: Ocorreu um erro ao enviar para o Rabbit: {e}", flush=True)
            # Importante: Imprima o tipo do erro também
            import traceback
            traceback.print_exc()

        return created_user
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.repository.get_by_id(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.repository.get_by_email(email)
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repository.get_all(skip=skip, limit=limit)
    
    def update_user(self, user_id: int, name: Optional[str] = None, email: Optional[str] = None, password: Optional[str] = None, role: Optional[UserRole] = None) -> Optional[User]:
        user = self.repository.get_by_id(user_id)
        if not user:
            return None
        
        if name is not None:
            user.name = name
        
        if email is not None:
            existing_user = self.repository.get_by_email(email)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f"Email {email} já está em uso")
            user.email = email
        
        if password is not None:
            user.password_hash = self.hash_password(password)
        
        if role is not None:
            user.role = role
        
        return self.repository.update(user)
    
    def delete_user(self, user_id: int) -> bool:
        return self.repository.delete(user_id)
    
    # ==========================================================
    # RECUPERAÇÃO DE SENHA (AQUI ESTÁ A MUDANÇA)
    # ==========================================================
    
    def generate_reset_token(self, email: str) -> Optional[Tuple[str, datetime]]:
        if not self.db:
            raise RuntimeError("Database session not available")
        
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(
            minutes=getattr(settings, 'RESET_TOKEN_EXPIRE_MINUTES', 15)
        )
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        
        self.db.add(reset_token)
        self.db.commit()
        
        return token, expires_at
    
    def validate_reset_token(self, token: str) -> Optional[User]:
        if not self.db:
            raise RuntimeError("Database session not available")
        
        reset_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        if not reset_token or reset_token.used or datetime.utcnow() > reset_token.expires_at:
            return None
        
        return self.repository.get_by_id(reset_token.user_id)
    
    def reset_password(self, token: str, new_password: str) -> Optional[User]:
        if not self.db:
            raise RuntimeError("Database session not available")
        
        reset_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).with_for_update().first()
        
        if not reset_token or reset_token.used or datetime.utcnow() > reset_token.expires_at:
            return None

        user = self.repository.get_by_id(reset_token.user_id)
        if not user:
            return None

        try:
            user.password_hash = self.hash_password(new_password)
            self.db.add(user)
            reset_token.used = True
            reset_token.used_at = datetime.utcnow()
            self.db.add(reset_token)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return user
    
    async def send_reset_email(self, email: str, token: str, reset_url_base: str) -> bool:
        """
        Publica o evento no RabbitMQ de forma não bloqueante.
        """
        # Executa a função _publish_message (que é síncrona) em uma thread separada
        # Isso impede que o 'pika' trave o servidor FastAPI enquanto conecta
        await asyncio.to_thread(self._publish_message, email, token)
        return True

    def _publish_message(self, email: str, token: str):
        """Método auxiliar síncrono para instanciar e usar o Producer"""
        try:
            # 1. Instancia o produtor (Isso lê as configs)
            producer = RabbitMQProducer()
            
            # 2. Chama o método de publicar
            producer.publish_password_reset(email, token)
            
        except Exception as e:
            logger.error(f"❌ Erro crítico ao tentar publicar mensagem: {e}")