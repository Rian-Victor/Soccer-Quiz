"""
Interfaces para repositórios
Segue o princípio DIP - Depender de abstrações
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class ITeamRepository(ABC):
    """Interface para repositório de times"""
    
    @abstractmethod
    async def create(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um novo time"""
        pass
    
    @abstractmethod
    async def get_by_id(self, team_id: str) -> Optional[Dict[str, Any]]:
        """Busca time por ID"""
        pass
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Lista todos os times"""
        pass
    
    @abstractmethod
    async def update(self, team_id: str, team_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza um time"""
        pass
    
    @abstractmethod
    async def delete(self, team_id: str) -> bool:
        """Deleta um time"""
        pass


class IQuestionRepository(ABC):
    """Interface para repositório de perguntas"""
    
    @abstractmethod
    async def create(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria uma nova pergunta"""
        pass
    
    @abstractmethod
    async def get_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Busca pergunta por ID"""
        pass
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Lista todas as perguntas"""
        pass
    
    @abstractmethod
    async def update(self, question_id: str, question_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza uma pergunta"""
        pass
    
    @abstractmethod
    async def delete(self, question_id: str) -> bool:
        """Deleta uma pergunta"""
        pass


class IAnswerRepository(ABC):
    """Interface para repositório de respostas"""
    
    @abstractmethod
    async def create(self, answer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria uma nova resposta"""
        pass
    
    @abstractmethod
    async def get_by_id(self, answer_id: str) -> Optional[Dict[str, Any]]:
        """Busca resposta por ID"""
        pass
    
    @abstractmethod
    async def get_all(self, skip: int = 0, limit: int = 100, question_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lista todas as respostas (opcionalmente filtradas por question_id)"""
        pass
    
    @abstractmethod
    async def update(self, answer_id: str, answer_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza uma resposta"""
        pass
    
    @abstractmethod
    async def delete(self, answer_id: str) -> bool:
        """Deleta uma resposta"""
        pass

