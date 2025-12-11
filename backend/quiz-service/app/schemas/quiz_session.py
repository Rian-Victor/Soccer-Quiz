from datetime import datetime
from typing import List, Optional, Annotated
from enum import Enum
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class QuizStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class QuizType(str, Enum):
    GENERAL = "general"
    TEAM = "team"

class QuestionAnswer(BaseModel):
    """Resposta dada pelo usuário em uma pergunta"""
    question_id: str
    selected_answer_id: str
    is_correct: bool
    time_taken_seconds: int 
    points_earned: int

class QuizSession(BaseModel):
    """
    Representação da Sessão no Banco de Dados (MongoDB)
    """

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    user_id: int
    quiz_type: QuizType 
    team_id: Optional[str] = None
    
    status: QuizStatus = QuizStatus.IN_PROGRESS 
    
    questions: List[str] 
    current_question_index: int = 0
    answers: List[QuestionAnswer] = []
    
    total_points: int = 0
    correct_answers: int = 0
    wrong_answers: int = 0
    
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_time_seconds: Optional[int] = None

   
    model_config = ConfigDict(
        populate_by_name=True, 
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )