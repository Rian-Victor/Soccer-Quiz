"""
Interface para comunicação com User Service
Segue o princípio DIP - Depender de abstrações
"""
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class UserData(BaseModel):
    """Dados do usuário retornados pelo User Service"""
    id: int
    email: str
    password_hash: str
    role: str  # "admin" ou "comum"
    name: str = "Usuário"


class IUserService(ABC):
    """Interface para buscar dados do usuário"""
    
    @abstractmethod
    async def get_user_by_email(self, email: str) -> Optional[UserData]:
        """
        Busca usuário por email
        
        Args:
            email: Email do usuário
            
        Returns:
            Dados do usuário ou None se não encontrado
        """
        pass

