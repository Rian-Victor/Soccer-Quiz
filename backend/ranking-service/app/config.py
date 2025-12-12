"""
Configurações do Ranking Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do serviço
    PORT: int = 3004
    
    # Modo debug
    DEBUG: bool = True

    # RABBIT
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017/ranking_db"
    MONGODB_DB: str = "soccer_ranking"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()

