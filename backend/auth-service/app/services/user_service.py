"""
Implementação concreta do User Service client
Faz requisições HTTP para o User Service
"""
import httpx
from typing import Optional

from app.config import settings
from app.interfaces.user_service import IUserService, UserData


class UserServiceClient(IUserService):
    """Cliente HTTP para comunicação com User Service"""
    
    def __init__(self):
        self.base_url = settings.USER_SERVICE_URL
        self.client = httpx.AsyncClient(timeout=10.0)
    
    async def get_user_by_email(self, email: str) -> Optional[UserData]:
        """
        Busca usuário por email via endpoint interno do User Service
        
        Args:
            email: Email do usuário
            
        Returns:
            Dados do usuário ou None se não encontrado
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/users/internal/by-email",
                params={"email": email}
            )
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            return UserData(
                id=data["id"],
                email=data["email"],
                password_hash=data["passwordHash"],
                role=data["role"],
                name=data.get("name", "Usuário")
            )
        except httpx.HTTPError as e:
            print(f"Erro ao buscar usuário no User Service: {e}")
            return None
        except Exception as e:
            print(f"Erro inesperado ao buscar usuário: {e}")
            return None
        
    async def update_password(self, user_id: int, new_password_hash: str) -> bool:
        """
        Envia solicitação para atualizar a senha do usuário no User Service
        """
        try:
            response = await self.client.patch(
                f"{self.base_url}/users/internal/{user_id}/password",
                json={"password_hash": new_password_hash}
            )
            
            if response.status_code == 200:
                return True
                
            print(f"Falha ao atualizar senha. Status: {response.status_code}")
            return False
            
        except Exception as e:
            print(f"Erro ao comunicar atualização de senha: {e}")
            return False
    
    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()

