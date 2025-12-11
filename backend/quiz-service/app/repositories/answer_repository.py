"""
Implementação concreta do repositório de respostas usando MongoDB
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.interfaces.repositories import IAnswerRepository
from app.database import get_database



class AnswerRepository(IAnswerRepository):
    """Implementação do repositório de respostas com MongoDB"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        #self.db = get_database()
        self.collection = db["answers"]
    
    def _convert_id(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Auxiliar para converter ObjectId em string"""
        if data and "_id" in data:
            data["id"] = str(data["_id"])
            # del data["_id"] # Opcional, depende se você quer limpar
        return data
    
    async def get_by_question(self, question_id: str) -> List[Dict[str, Any]]:
        """Busca todas as respostas de uma pergunta específica"""
        # Procura onde o campo 'questionId' é igual ao id passado
        cursor = self.collection.find({"questionId": question_id})
        
        answers = []
        async for doc in cursor:
            answers.append(self._convert_id(doc))
            
        return answers
    
    async def create(self, answer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria uma nova resposta"""
        result = await self.collection.insert_one(answer_data)
        answer = await self.collection.find_one({"_id": result.inserted_id})
        return self._convert_id(answer)
    
    async def get_by_id(self, answer_id: str) -> Optional[Dict[str, Any]]:
        """Busca resposta por ID"""
        try:
            answer = await self.collection.find_one({"_id": ObjectId(answer_id)})
            return self._convert_id(answer) if answer else None
        except InvalidId:
            return None
    
    async def get_all(self, skip: int = 0, limit: int = 100, question_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lista todas as respostas (opcionalmente filtradas por question_id)"""
        query = {}
        if question_id:
            query["questionId"] = question_id
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        answers = []
        async for answer in cursor:
            answers.append(self._convert_id(answer))
        return answers
    
    async def update(self, answer_id: str, answer_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza uma resposta"""
        try:
            # Remover campos None
            update_data = {k: v for k, v in answer_data.items() if v is not None}
            
            result = await self.collection.update_one(
                {"_id": ObjectId(answer_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                answer = await self.collection.find_one({"_id": ObjectId(answer_id)})
                return self._convert_id(answer)
            return None
        except InvalidId:
            return None
    
    async def delete(self, answer_id: str) -> bool:
        """Deleta uma resposta"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(answer_id)})
            return result.deleted_count > 0
        except InvalidId:
            return False
        

