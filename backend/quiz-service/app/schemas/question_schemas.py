from typing import List, Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class QuestionBase(BaseModel):
    statement: str = Field(..., description="O enunciado da pergunta")
    options: List[str] = Field(..., min_length=2, description="Lista de opções de resposta")
    correct_option_index: int = Field(..., ge=0, description="Índice da resposta correta na lista")
    difficulty: str = "medium"
    
    team_id: Optional[str] = Field(None, description="ID do time relacionado (opcional)")

# 2. Schema de Entrada (Request) - O que o Admin envia
class QuestionCreateRequest(QuestionBase):
    
    def validate_index(self):
        """Valida se o índice da resposta correta existe na lista de opções"""
        if self.correct_option_index >= len(self.options):
            raise ValueError(
                f"O índice da resposta correta ({self.correct_option_index}) "
                f"é inválido. Você enviou apenas {len(self.options)} opções."
            )

# 3. Schema de Saída (Response/DB) - O que sai do Banco
class QuestionDB(QuestionBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str}
    )