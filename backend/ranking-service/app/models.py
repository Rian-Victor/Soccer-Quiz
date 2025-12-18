"""
Models/Schemas para o Ranking Service
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List
from datetime import datetime
from bson import ObjectId
from enum import Enum


# ============================================================================
# HELPERS & UTILS
# ============================================================================

class PyObjectId(ObjectId):
    """Wrapper para ObjectId do MongoDB compatível com Pydantic"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


# ============================================================================
# ENUMS
# ============================================================================

class RankingType(str, Enum):
    """Tipos de ranking disponíveis"""
    GENERAL = "general"           # Por pontos totais
    FASTEST = "fastest"           # Mais rápidos com 100%
    WEEKLY = "weekly"             # Ranking semanal
    MONTHLY = "monthly"           # Ranking mensal
    TEAM = "team"                 # Por time específico


class RankingPeriod(str, Enum):
    """Períodos de ranking"""
    ALL_TIME = "all_time"         # Desde sempre
    CURRENT_WEEK = "current_week" # Semana atual (ISO)
    CURRENT_MONTH = "current_month" # Mês atual
    CUSTOM = "custom"             # Período customizado


class AchievementCategory(str, Enum):
    """Categorias de conquistas"""
    MILESTONE = "milestone"       # Marcos (1º quiz, 50 quizzes, etc)
    PERFORMANCE = "performance"   # Desempenho (100%, velocidade)
    CONSISTENCY = "consistency"   # Consistência (streak, média)
    MASTERY = "mastery"          # Maestria (tópicos, dificuldade)
    SOCIAL = "social"            # Social (times, comparações)


# ============================================================================
# DIFFICULTY & TOPIC STATS
# ============================================================================

class DifficultyStats(BaseModel):
    """Estatísticas por nível de dificuldade"""
    correct: int = 0
    wrong: int = 0
    accuracy: float = 0.0
    
    @validator('accuracy', pre=True, always=True)
    def calculate_accuracy(cls, v, values):
        """Calcula accuracy automaticamente"""
        correct = values.get('correct', 0)
        wrong = values.get('wrong', 0)
        total = correct + wrong
        return round((correct / total * 100), 2) if total > 0 else 0.0


class TopicStats(BaseModel):
    """Estatísticas por tópico"""
    topic: str
    correct: int = 0
    wrong: int = 0
    accuracy: float = 0.0
    total_questions: int = 0
    
    @validator('total_questions', pre=True, always=True)
    def calculate_total(cls, v, values):
        return values.get('correct', 0) + values.get('wrong', 0)


# ============================================================================
# USER STATS
# ============================================================================

class UserStats(BaseModel):
    """
    Estatísticas agregadas de um usuário
    Collection: user_stats
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: int = Field(..., description="ID do usuário (do Auth Service)")
    
    # Contadores gerais
    total_points: int = Field(0, ge=0)
    quiz_count: int = Field(0, ge=0)
    total_correct_answers: int = Field(0, ge=0)
    total_wrong_answers: int = Field(0, ge=0)
    total_time_seconds: int = Field(0, ge=0)
    
    # Médias e melhores
    average_accuracy: float = Field(0.0, ge=0.0, le=100.0)
    average_time_per_quiz: float = Field(0.0, ge=0.0)
    best_score: int = Field(0, ge=0)
    fastest_perfect_quiz_time: Optional[int] = Field(None, ge=0)
    
    # Estatísticas detalhadas
    difficulty_stats: Dict[str, DifficultyStats] = Field(
        default_factory=lambda: {
            "easy": DifficultyStats(),
            "medium": DifficultyStats(),
            "hard": DifficultyStats()
        }
    )
    topic_stats: Dict[str, TopicStats] = Field(default_factory=dict)
    
    # Streaks e consistência
    current_streak: int = Field(0, ge=0, description="Dias consecutivos jogando")
    longest_streak: int = Field(0, ge=0)
    last_quiz_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "user_id": 123,
                "total_points": 15420,
                "quiz_count": 18,
                "total_correct_answers": 162,
                "total_wrong_answers": 18,
                "average_accuracy": 90.0,
                "best_score": 980,
                "fastest_perfect_quiz_time": 240
            }
        }


class UserStatsUpdate(BaseModel):
    """DTO para atualização de stats após quiz"""
    total_points: int
    correct_answers: int
    wrong_answers: int
    time_taken: int
    accuracy: float
    difficulty_breakdown: Dict[str, Dict[str, int]]
    topic_breakdown: Optional[Dict[str, Dict[str, int]]] = None


# ============================================================================
# LEADERBOARD
# ============================================================================

class RankingEntry(BaseModel):
    """Uma entrada no ranking"""
    position: int = Field(..., ge=1)
    user_id: int
    total_points: int = Field(0, ge=0)
    quiz_count: int = Field(0, ge=0)
    avg_accuracy: float = Field(0.0, ge=0.0, le=100.0)
    
    # Campos opcionais dependendo do tipo de ranking
    total_time_seconds: Optional[int] = None  # Para fastest
    fastest_perfect_time: Optional[int] = None
    team_id: Optional[str] = None  # Para ranking de time
    
    class Config:
        json_schema_extra = {
            "example": {
                "position": 1,
                "user_id": 5,
                "total_points": 15420,
                "quiz_count": 18,
                "avg_accuracy": 90.0
            }
        }


class Leaderboard(BaseModel):
    """
    Cache de leaderboard
    Collection: leaderboards
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    ranking_type: RankingType
    period: RankingPeriod = RankingPeriod.ALL_TIME
    team_id: Optional[str] = None  # Para rankings por time
    
    rankings: List[RankingEntry] = Field(default_factory=list)
    
    # Metadados do cache
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime  # TTL do MongoDB remove automaticamente
    total_players: int = Field(0, ge=0)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    
    def is_expired(self) -> bool:
        """Verifica se o cache expirou"""
        return datetime.utcnow() > self.expires_at


class LeaderboardResponse(BaseModel):
    """Response para endpoints de ranking"""
    ranking_type: RankingType
    period: RankingPeriod
    rankings: List[RankingEntry]
    total_players: int
    generated_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "ranking_type": "general",
                "period": "all_time",
                "rankings": [
                    {
                        "position": 1,
                        "user_id": 5,
                        "total_points": 15420,
                        "quiz_count": 18,
                        "avg_accuracy": 90.0
                    }
                ],
                "total_players": 150,
                "generated_at": "2025-12-11T10:30:00"
            }
        }


# ============================================================================
# ACHIEVEMENTS
# ============================================================================

class AchievementCriteria(BaseModel):
    """Critérios para desbloquear conquista"""
    type: str  # quiz_count, accuracy, time, streak, etc
    condition: str  # ==, >=, <=, <, >
    value: float
    min_quizzes: Optional[int] = None  # Mínimo de quizzes para validar


class AchievementDefinition(BaseModel):
    """
    Definição de uma conquista
    Collection: achievement_definitions
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    achievement_id: str = Field(..., description="ID único da conquista")
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    icon: str = Field("🏆", description="Emoji ou URL do ícone")
    category: AchievementCategory
    points_reward: int = Field(0, ge=0)
    
    # Critérios
    criteria: AchievementCriteria
    
    # Metadados
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "achievement_id": "first_perfect",
                "name": "Perfeito!",
                "description": "Complete um quiz com 100% de acertos",
                "icon": "🏆",
                "category": "performance",
                "points_reward": 50,
                "criteria": {
                    "type": "accuracy",
                    "condition": "==",
                    "value": 100.0,
                    "min_quizzes": 1
                }
            }
        }


class UserAchievement(BaseModel):
    """
    Conquista desbloqueada por um usuário
    Collection: user_achievements
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: int
    achievement_id: str
    
    # Dados da conquista (desnormalizado para performance)
    achievement_name: str
    description: str
    icon: str
    points_reward: int
    category: AchievementCategory
    
    # Contexto do desbloqueio
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    quiz_session_id: Optional[str] = None  # Quiz que desbloqueou
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserAchievementsResponse(BaseModel):
    """Response com conquistas de um usuário"""
    user_id: int
    total_achievements: int
    total_points_from_achievements: int
    achievements: List[UserAchievement]


# ============================================================================
# RANKING HISTORY
# ============================================================================

class RankingSnapshot(BaseModel):
    """
    Snapshot diário do ranking de um usuário (para gráficos de progresso)
    Collection: ranking_history
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: int
    date: datetime = Field(default_factory=datetime.utcnow)
    
    # Stats do dia
    total_points: int
    quiz_count: int
    position_general: Optional[int] = None
    position_weekly: Optional[int] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserProgressResponse(BaseModel):
    """Response com histórico de progresso"""
    user_id: int
    snapshots: List[RankingSnapshot]
    period_start: datetime
    period_end: datetime


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class QuizCompletedEvent(BaseModel):
    """Evento recebido via RabbitMQ quando quiz é completado"""
    session_id: str
    user_id: int
    quiz_type: str
    team_id: Optional[str] = None
    total_points: int
    correct_answers: int
    wrong_answers: int
    total_time_seconds: int
    accuracy: float
    difficulty_breakdown: Dict[str, Dict[str, int]]
    completed_at: str  # ISO format


class UserStatsResponse(BaseModel):
    """Response completo de estatísticas do usuário"""
    user_id: int
    total_points: int
    quiz_count: int
    average_accuracy: float
    best_score: int
    fastest_perfect_quiz_time: Optional[int]
    current_streak: int
    longest_streak: int
    current_rank: Optional[int]
    difficulty_breakdown: Dict[str, DifficultyStats]
    topic_breakdown: Dict[str, TopicStats]
    last_quiz_at: Optional[datetime]
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ComparisonResponse(BaseModel):
    """Response de comparação entre dois usuários"""
    user1: UserStatsResponse
    user2: UserStatsResponse
    differences: Dict[str, float]  # Diferenças percentuais


# ============================================================================
# ANALYTICS MODELS
# ============================================================================

class DifficultyAnalytics(BaseModel):
    """Análise agregada por dificuldade"""
    difficulty: str
    total_questions: int
    total_correct: int
    total_wrong: int
    accuracy: float
    unique_players: int


class TopicAnalytics(BaseModel):
    """Análise agregada por tópico"""
    topic: str
    total_questions: int
    total_correct: int
    total_wrong: int
    accuracy: float
    unique_players: int
    most_difficult_question_id: Optional[str] = None


class TrendData(BaseModel):
    """Dados de tendência temporal"""
    date: datetime
    avg_accuracy: float
    total_quizzes: int
    unique_players: int
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class TrendsResponse(BaseModel):
    """Response com tendências temporais"""
    period_start: datetime
    period_end: datetime
    trends: List[TrendData]
    overall_growth: float  # % de crescimento no período
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}