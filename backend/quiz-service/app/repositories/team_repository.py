"""
Implementação concreta do repositório de times usando MongoDB
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId

from app.interfaces.repositories import ITeamRepository
from app.database import get_database


class TeamRepository(ITeamRepository):
    """Implementação do repositório de times com MongoDB"""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.teams
    
    def _convert_id(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Converte ObjectId para string"""
        if team_data and "_id" in team_data:
            team_data["id"] = str(team_data["_id"])
            del team_data["_id"]
        return team_data
    
    async def create(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um novo time"""
        result = await self.collection.insert_one(team_data)
        team = await self.collection.find_one({"_id": result.inserted_id})
        return self._convert_id(team)
    
    async def get_by_id(self, team_id: str) -> Optional[Dict[str, Any]]:
        """Busca time por ID"""
        try:
            team = await self.collection.find_one({"_id": ObjectId(team_id)})
            return self._convert_id(team) if team else None
        except InvalidId:
            return None
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Lista todos os times"""
        cursor = self.collection.find().skip(skip).limit(limit)
        teams = []
        async for team in cursor:
            teams.append(self._convert_id(team))
        return teams
    
    async def update(self, team_id: str, team_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza um time"""
        try:
            # Remover campos None
            update_data = {k: v for k, v in team_data.items() if v is not None}
            
            result = await self.collection.update_one(
                {"_id": ObjectId(team_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                team = await self.collection.find_one({"_id": ObjectId(team_id)})
                return self._convert_id(team)
            return None
        except InvalidId:
            return None
    
    async def delete(self, team_id: str) -> bool:
        """Deleta um time"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(team_id)})
            return result.deleted_count > 0
        except InvalidId:
            return False

