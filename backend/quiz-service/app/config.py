"""
Configurações do Quiz Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do serviço
    PORT: int = 3000
    
    # Modo debug
    DEBUG: bool = True

    # RabbitMQ Configuration
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/"
    RABBITMQ_EXCHANGE: str = "notifications"
    
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/quiz_db"
    MONGODB_DB: str = "soccer_quiz"

    #ver isso aqui depois
    QUIZ_DB_NAME: str = "quiz_db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()

