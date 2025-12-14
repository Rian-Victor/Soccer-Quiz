
from pydantic import BaseModel, model_validator, Field
from typing import Optional
from .quiz_session import QuizType

class StartQuizRequest(BaseModel):
    quiz_type: QuizType = QuizType.GENERAL
    team_id: Optional[str] = None

    @model_validator(mode='after')
    def check_team_id_required(self):
        if self.quiz_type == QuizType.TEAM and not self.team_id:
            raise ValueError('team_id é obrigatório quando o quiz_type é "team"')
        return self

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer_id: str
    time_taken_seconds: int