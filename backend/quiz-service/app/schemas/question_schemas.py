from typing import List, Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

# Base Comum
class QuestionBase(BaseModel):
    statement: str = Field(..., description="O enunciado da pergunta")
    difficulty: str = "medium"
    topic: str = "Geral"
    team_id: Optional[str] = Field(None, description="ID do time")
    
    # AGORA FAZ SENTIDO: A base tem options, e o banco vai ter options.
    options: List[str] = Field(..., min_length=2)
    correct_option_index: int = Field(..., ge=0)

# Request (O que entra)
class QuestionCreateRequest(QuestionBase):
    def validate_index(self):
        if self.correct_option_index >= len(self.options):
            raise ValueError("Índice inválido.")

# Response/DB (O que sai)
class QuestionDB(QuestionBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )