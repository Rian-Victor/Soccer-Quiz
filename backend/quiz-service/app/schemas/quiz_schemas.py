from typing import List, Optional, Annotated
from datetime import datetime
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    question_ids: List[str] = Field(..., min_items=1)
    team_id: Optional[str] = Field(None, description="ID do time associado ao quiz")

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    question_ids: Optional[List[str]] = None
    team_id: Optional[str] = None

class QuizDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    description: Optional[str] = None
    question_ids: List[str]
    team_id: Optional[str] = None
    created_at: datetime
    created_by: int
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

