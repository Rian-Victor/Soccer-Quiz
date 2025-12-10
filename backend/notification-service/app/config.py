"""
Configurações do Notification Service
"""
import logging

from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do serviço
    PORT: int = 3004
    
    # Modo debug
    DEBUG: bool = True
    
    # RabbitMQ Configuration
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/"
    RABBITMQ_EXCHANGE: str = "notifications"
    
    
    # SMTP Configuration (Email)
    SMTP_HOST: str = "smtp.gmail.com"  # ou seu servidor SMTP
    SMTP_PORT: int = 587
    SMTP_USER: str   # Ex: seu-email@gmail.com
    SMTP_PASSWORD: str   # Ex: sua-app-password
    SMTP_FROM_EMAIL: str = "noreply@futquiz.com"
    SMTP_FROM_NAME: str = "FutQuiz"
    
    # Email Templates
    PASSWORD_RESET_SUBJECT: str = "Recuperação de Senha - FutQuiz"

    # Frontend Integration (Valores padrão para desenvolvimento)
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    FRONTEND_RESET_PATH: str = "/reset-password"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validação na inicialização
        self._validate_smtp_config()
    
    def _validate_smtp_config(self):
        """Valida configurações SMTP obrigatórias"""
        if not self.SMTP_USER:
            logger.error("❌ SMTP_USER não configurado!")
            raise ValueError("SMTP_USER é obrigatório")
        
        if not self.SMTP_PASSWORD:
            logger.error("❌ SMTP_PASSWORD não configurado!")
            raise ValueError("SMTP_PASSWORD é obrigatório")
        
        logger.info(f"✅ SMTP configurado: {self.SMTP_USER} @ {self.SMTP_HOST}:{self.SMTP_PORT}")


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()
