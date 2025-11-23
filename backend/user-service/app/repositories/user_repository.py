"""
Implementação concreta do repositório de usuários usando SQLAlchemy
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models import User
from app.interfaces.user_repository import IUserRepository


class UserRepository(IUserRepository):
    """Implementação do repositório de usuários com SQLAlchemy"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, user: User) -> User:
        """Cria um novo usuário"""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """Busca usuário por ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Busca usuário por email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Lista todos os usuários"""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def update(self, user: User) -> User:
        """Atualiza um usuário"""
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete(self, user_id: int) -> bool:
        """Deleta um usuário"""
        user = self.get_by_id(user_id)
        if user:
            self.db.delete(user)
            self.db.commit()
            return True
        return False

