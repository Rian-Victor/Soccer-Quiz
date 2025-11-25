"""
Serviço de usuários
Gerencia CRUD de usuários e lógica de domínio
"""
from typing import Optional, List
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models import User, UserRole
from app.interfaces.user_repository import IUserRepository
from app.repositories.user_repository import UserRepository

# Contexto para hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """Serviço para gerenciar usuários"""
    
    # DIP: depende de IUserRepository para não acoplar diretamente à camada de persistência.
    def __init__(self, repository: IUserRepository):
        self.repository = repository
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Gera hash da senha usando bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica se a senha está correta"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_user(
        self,
        name: str,
        email: str,
        password: str,
        role: UserRole = UserRole.COMUM
    ) -> User:
        """
        Cria um novo usuário
        
        Args:
            name: Nome do usuário
            email: Email do usuário
            password: Senha em texto plano
            role: Role do usuário (admin/comum)
            
        Returns:
            Usuário criado
        """
        # Verificar se o email já existe
        existing_user = self.repository.get_by_email(email)
        if existing_user:
            raise ValueError(f"Email {email} já está em uso")
        
        # Criar hash da senha
        password_hash = self.hash_password(password)
        
        # Criar usuário
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role.value if hasattr(role, 'value') else role
        )
        
        return self.repository.create(user)
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Busca usuário por ID"""
        return self.repository.get_by_id(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Busca usuário por email"""
        return self.repository.get_by_email(email)
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Lista todos os usuários"""
        return self.repository.get_all(skip=skip, limit=limit)
    
    def update_user(
        self,
        user_id: int,
        name: Optional[str] = None,
        email: Optional[str] = None,
        password: Optional[str] = None,
        role: Optional[UserRole] = None
    ) -> Optional[User]:
        """
        Atualiza um usuário
        
        Args:
            user_id: ID do usuário
            name: Novo nome (opcional)
            email: Novo email (opcional)
            password: Nova senha (opcional)
            role: Nova role (opcional)
            
        Returns:
            Usuário atualizado ou None se não encontrado
        """
        user = self.repository.get_by_id(user_id)
        if not user:
            return None
        
        if name is not None:
            user.name = name
        
        if email is not None:
            # Verificar se o email já está em uso por outro usuário
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
        """Deleta um usuário"""
        return self.repository.delete(user_id)

