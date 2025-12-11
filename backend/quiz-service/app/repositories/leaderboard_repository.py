# quiz-service/app/repositories/leaderboard_repository.py

from typing import List, Optional
from datetime import datetime # <--- Faltava importar isso
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

# Certifique-se de importar do caminho certo (schemas ou models)
from app.schemas.leaderboard import LeaderboardEntry 

class LeaderboardRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["leaderboard"]
        # Sugestão: Crie índices para performance, já que ranking é leitura pesada
        # await self.collection.create_index([("total_points", -1)])
    
    async def get_or_create(self, user_id: int, user_name: str) -> LeaderboardEntry:
        """Busca ou cria entrada do usuário no ranking"""
        doc = await self.collection.find_one({"user_id": user_id})
        
        if doc:
            return LeaderboardEntry(**doc)
        
        # Criar nova entrada
        entry = LeaderboardEntry(
            user_id=user_id,
            user_name=user_name,
            last_quiz_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Pydantic V2: model_dump
        entry_dict = entry.model_dump(by_alias=True, exclude={"id"})
        result = await self.collection.insert_one(entry_dict)
        
        # Converte para string para garantir compatibilidade com o Model Pydantic
        entry.id = str(result.inserted_id)
        return entry
    
    async def update(self, entry: LeaderboardEntry) -> LeaderboardEntry:
        """Atualiza entrada no ranking"""
        if not entry.id:
            raise ValueError("Não é possível atualizar uma entrada sem ID")

        # Pydantic V2: model_dump
        entry_dict = entry.model_dump(by_alias=True, exclude={"id"})
        
        # Correção Crítica: Converter string id para ObjectId antes de consultar o banco
        try:
            oid = ObjectId(entry.id)
        except InvalidId:
            raise ValueError(f"ID inválido: {entry.id}")

        await self.collection.update_one(
            {"_id": oid},
            {"$set": entry_dict}
        )
        return entry
    
    async def get_top(self, limit: int = 100) -> List[LeaderboardEntry]:
        """Top ranking por pontuação total"""
        # Sort -1 é decrescente (do maior para o menor)
        cursor = self.collection.find().sort("total_points", -1).limit(limit)
        return [LeaderboardEntry(**doc) async for doc in cursor]
    
    async def get_fastest_players(self, limit: int = 10) -> List[LeaderboardEntry]:
        """Jogadores mais rápidos (com 100% acerto)"""
        cursor = self.collection.find({
            "fastest_completion_time": {"$ne": None}
        }).sort("fastest_completion_time", 1).limit(limit)
        
        return [LeaderboardEntry(**doc) async for doc in cursor]