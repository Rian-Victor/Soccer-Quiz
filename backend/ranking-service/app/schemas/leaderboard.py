"""
Schema do Ranking Entry
"""
from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]


class LeaderboardEntry(BaseModel):
    """Entrada no ranking (Documento MongoDB)"""
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    user_id: int
    user_name: str  
    
    # Estatísticas gerais
    total_quizzes_completed: int = 0
    total_points: int = 0
    average_points: float = 0.0
    
    # Melhor desempenho
    best_quiz_points: int = 0
    best_quiz_time_seconds: Optional[int] = None
    fastest_completion_time: Optional[int] = None 
    
    # Última atualização
    last_quiz_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        populate_by_name=True,      
        arbitrary_types_allowed=True 
    )
