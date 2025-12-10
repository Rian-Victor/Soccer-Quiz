"""
Serviço de usuários
Gerencia CRUD de usuários e lógica de domínio
"""
from typing import Optional, List
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import logging

from app.models import User, UserRole
from app.interfaces.user_repository import IUserRepository
from app.producers import RabbitMQProducer 
from app.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """Serviço para gerenciar usuários"""
    
    def __init__(self, repository: IUserRepository, db: Session = None):
        self.repository = repository
        self.db = db
        self.producer = RabbitMQProducer()
    
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

        try:
            producer = RabbitMQProducer()
            producer.publish_user_registered(created_user.email, created_user.name)

        except Exception as e:
            logger.error(f"Erro crítico ao enviar para o RabbitMQ: {e}")

        return created_user
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.repository.get_by_id(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.repository.get_by_email(email)
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repository.get_all(skip=skip, limit=limit)
    
    def update_user(self, user_id: int, name: Optional[str] = None, email: Optional[str] = None, password: Optional[str] = None, role: Optional[UserRole] = None) -> Optional[User]:
        """Atualização padrão (com rehash de senha se necessário)"""
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
        """Deleta um usuário e limpa seus dados relacionados"""
        user = self.repository.get_by_id(user_id)
        if not user:
            return False
        
        try:
            import httpx
            with httpx.Client() as client:
                # Limpar refresh tokens
                client.delete(
                    f"{settings.AUTH_SERVICE_URL}/auth/users/{user_id}/tokens"
                )
        except Exception as e:
            logger.error(f"❌ Erro ao limpar tokens no auth-service: {e}")
            
        deleted = self.repository.delete(user_id)
        
        if deleted:
            logger.info(f"✅ Usuário {user_id} deletado com sucesso")
        
        return deleted
        