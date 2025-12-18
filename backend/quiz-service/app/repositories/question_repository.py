"""
Implementação concreta do repositório de perguntas usando MongoDB
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database


class QuestionRepository:
    """Implementação do repositório de perguntas com MongoDB"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        #self.db = get_database()
        self.collection = db["questions"]
    
    def _convert_id(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Converte ObjectId para string"""
        if question_data and "_id" in question_data:
            question_data["id"] = str(question_data["_id"])
            del question_data["_id"]
        return question_data
    
    async def create(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria uma nova pergunta"""
        result = await self.collection.insert_one(question_data)
        question = await self.collection.find_one({"_id": result.inserted_id})
        return self._convert_id(question)
    
    async def get_by_id(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Busca pergunta por ID"""
        try:
            question = await self.collection.find_one({"_id": ObjectId(question_id)})
            return self._convert_id(question) if question else None
        except InvalidId:
            return None
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Lista todas as perguntas"""
        cursor = self.collection.find().skip(skip).limit(limit)
        questions = []
        async for question in cursor:
            questions.append(self._convert_id(question))
        return questions
    
    async def update(self, question_id: str, question_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza uma pergunta"""
        try:
            update_data = {k: v for k, v in question_data.items() if v is not None}
            
            result = await self.collection.update_one(
                {"_id": ObjectId(question_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                question = await self.collection.find_one({"_id": ObjectId(question_id)})
                return self._convert_id(question)
            return None
        except InvalidId:
            return None
    
    async def delete(self, question_id: str) -> bool:
        """Deleta uma pergunta"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(question_id)})
            return result.deleted_count > 0
        except InvalidId:
            return False
        
    async def get_random_questions(self, limit: int = 10, team_id: Optional[str] = None) -> List[Dict[str, Any]]:
        pipeline = []

        # 1. ESTÁGIO DE FILTRO (MATCH)
        if team_id:
            pipeline.append({
                "$match": {"team_id": team_id}
            })
        
        # 2. ESTÁGIO DE SORTEIO (SAMPLE)
        pipeline.append({
            "$sample": {"size": limit}
        })

        # Executa a agregação
        cursor = self.collection.aggregate(pipeline)
        questions = await cursor.to_list(length=limit)
  
        for q in questions:
            q["id"] = str(q["_id"])
            
        return questions

