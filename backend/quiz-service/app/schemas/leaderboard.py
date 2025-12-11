# quiz-service/app/schemas/leaderboard.py (ou models/leaderboard.py)

from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator

# 1. Definindo PyObjectId para Pydantic V2
# Isso converte automaticamente o ObjectId do Mongo para string no JSON
PyObjectId = Annotated[str, BeforeValidator(str)]

class LeaderboardEntry(BaseModel):
    """Entrada no ranking (Documento MongoDB)"""
    
    # Mapeia _id do Mongo para id do Python
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    user_id: int
    user_name: str  # Cache do nome (ótimo para performance de leitura)
    
    # Estatísticas gerais
    total_quizzes_completed: int = 0
    total_points: int = 0
    average_points: float = 0.0
    
    # Melhor desempenho
    best_quiz_points: int = 0
    best_quiz_time_seconds: Optional[int] = None
    fastest_completion_time: Optional[int] = None  # Ex: Menor tempo com 100% acerto
    
    # Última atualização
    last_quiz_at: datetime
    updated_at: datetime
    
    # 2. Configuração Moderna (Pydantic V2)
    model_config = ConfigDict(
        populate_by_name=True,      # Permite criar usando id=... ou _id=...
        arbitrary_types_allowed=True # Permite tipos do Bson/Mongo se necessário
    )