

from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from app.schemas.quiz_session import QuizSession, QuizStatus 

class QuizSessionRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["quiz_sessions"]

        # TODO índices para performance
    
    async def create(self, session: QuizSession) -> QuizSession:
        """Cria uma nova sessão de quiz"""
        session_dict = session.model_dump(by_alias=True, exclude={"id"})
        
        result = await self.collection.insert_one(session_dict)

        session.id = str(result.inserted_id)
        return session
    
    async def get_by_id(self, session_id: str) -> Optional[QuizSession]:
        """Busca sessão por ID com validação de ObjectId"""
        try:
            oid = ObjectId(session_id)
        except InvalidId:
            return None

        doc = await self.collection.find_one({"_id": oid})
        return QuizSession(**doc) if doc else None
    
    async def get_active_by_user(self, user_id: int) -> Optional[QuizSession]:
        """Busca sessão ativa do usuário"""
        doc = await self.collection.find_one({
            "user_id": user_id,
            "status": QuizStatus.IN_PROGRESS.value 
        })
        return QuizSession(**doc) if doc else None
    
    async def update(self, session: QuizSession) -> QuizSession:
        """Atualiza sessão"""
        try:
            oid = ObjectId(session.id)
        except InvalidId:
            raise ValueError("ID da sessão inválido para atualização")

        session_dict = session.model_dump(by_alias=True, exclude={"id"})
        
        await self.collection.update_one(
            {"_id": oid},
            {"$set": session_dict}
        )
        return session
    
    async def get_user_history(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 20
    ) -> List[QuizSession]:
        """Histórico de quizzes do usuário (apenas finalizados)"""
        cursor = self.collection.find({
            "user_id": user_id,
            "status": {"$in": [QuizStatus.COMPLETED.value, QuizStatus.ABANDONED.value]}
        }).sort("started_at", -1).skip(skip).limit(limit)
        
        return [QuizSession(**doc) async for doc in cursor]
    
    async def get_top_scores(
        self, 
        quiz_type: Optional[str] = None,
        team_id: Optional[str] = None,
        limit: int = 10
    ) -> List[QuizSession]:
        """
        Top pontuações.
        Critério: 
        1. Mais pontos (DESC)
        2. Menos tempo (ASC) - Critério de desempate
        """
        query = {"status": QuizStatus.COMPLETED.value}
        
        if quiz_type:
            query["quiz_type"] = quiz_type
        if team_id:
            query["team_id"] = team_id
        
        # Ordenação Composta: Pontos descendo (-1), Tempo subindo (1)
        cursor = self.collection.find(query).sort([
            ("total_points", -1),       
            ("total_time_seconds", 1)   
        ]).limit(limit)
        
        return [QuizSession(**doc) async for doc in cursor]