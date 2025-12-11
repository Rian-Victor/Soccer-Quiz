from datetime import datetime
from typing import List, Optional, Annotated
from enum import Enum
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from bson import ObjectId

# --- 1. Tratamento Moderno de ObjectId (Pydantic V2) ---
# Converte automaticamente ObjectId para str e aceita str como ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

# --- 2. Enums para evitar "Magic Strings" ---
class QuizStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class QuizType(str, Enum):
    GENERAL = "general"
    TEAM = "team"

# --- 3. Sub-models ---
class QuestionAnswer(BaseModel):
    """Resposta dada pelo usuário em uma pergunta"""
    question_id: str
    selected_answer_id: str
    is_correct: bool
    time_taken_seconds: int 
    points_earned: int

# --- 4. Modelo Principal ---
class QuizSession(BaseModel):
    """
    Representação da Sessão no Banco de Dados (MongoDB)
    """
    # Mapeia '_id' do Mongo para 'id' no Python, mas permite ambos
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    user_id: int
    quiz_type: QuizType # Usa o Enum
    team_id: Optional[str] = None
    
    status: QuizStatus = QuizStatus.IN_PROGRESS # Default via Enum
    
    questions: List[str] # Lista de IDs das perguntas
    current_question_index: int = 0
    answers: List[QuestionAnswer] = []
    
    total_points: int = 0
    correct_answers: int = 0
    wrong_answers: int = 0
    
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_time_seconds: Optional[int] = None

    # Configuração nova do Pydantic V2
    model_config = ConfigDict(
        populate_by_name=True, # Permite usar quiz.id ao invés de quiz._id
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )