
from pydantic import BaseModel
from typing import Optional

class StartQuizRequest(BaseModel):
    quiz_type: str = "general"
    team_id: Optional[str] = None

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer_id: str
    time_taken_seconds: int