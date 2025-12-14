"""
Implementação concreta do repositório de quizzes usando MongoDB
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase


class QuizRepository:
    """Implementação do repositório de quizzes com MongoDB"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["quizzes"]
    
    def _convert_id(self, quiz_data: Dict[str, Any]) -> Dict[str, Any]:
        """Converte ObjectId para string"""
        if quiz_data and "_id" in quiz_data:
            quiz_data["id"] = str(quiz_data["_id"])
            del quiz_data["_id"]
        return quiz_data
    
    async def create(self, quiz_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um novo quiz"""
        result = await self.collection.insert_one(quiz_data)
        quiz = await self.collection.find_one({"_id": result.inserted_id})
        return self._convert_id(quiz)
    
    async def get_by_id(self, quiz_id: str) -> Optional[Dict[str, Any]]:
        """Busca quiz por ID"""
        try:
            quiz = await self.collection.find_one({"_id": ObjectId(quiz_id)})
            return self._convert_id(quiz) if quiz else None
        except InvalidId:
            return None
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Lista todos os quizzes"""
        cursor = self.collection.find().skip(skip).limit(limit).sort("created_at", -1)
        quizzes = []
        async for quiz in cursor:
            quizzes.append(self._convert_id(quiz))
        return quizzes
    
    async def update(self, quiz_id: str, quiz_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza um quiz"""
        try:
            update_data = {k: v for k, v in quiz_data.items() if v is not None}
            
            result = await self.collection.update_one(
                {"_id": ObjectId(quiz_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                quiz = await self.collection.find_one({"_id": ObjectId(quiz_id)})
                return self._convert_id(quiz)
            return None
        except InvalidId:
            return None
    
    async def delete(self, quiz_id: str) -> bool:
        """Deleta um quiz"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(quiz_id)})
            return result.deleted_count > 0
        except InvalidId:
            return False
    
    async def get_questions_by_quiz_id(self, quiz_id: str) -> List[str]:
        """Retorna os question_ids de um quiz"""
        quiz = await self.get_by_id(quiz_id)
        if not quiz:
            return []
        return quiz.get("question_ids", [])

