"""
Configurações do Notification Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do serviço
    PORT: int = 3004
    
    # Modo debug
    DEBUG: bool = True
    
    # RabbitMQ Configuration
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    RABBITMQ_QUEUE: str = "password_reset_emails"
    RABBITMQ_EXCHANGE: str = "notifications"
    RABBITMQ_ROUTING_KEY: str = "email.password_reset"
    
    # SMTP Configuration (Email)
    SMTP_HOST: str = "smtp.gmail.com"  # ou seu servidor SMTP
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # Ex: seu-email@gmail.com
    SMTP_PASSWORD: str = ""  # Ex: sua-app-password
    SMTP_FROM_EMAIL: str = "noreply@soccer-quiz.com"
    SMTP_FROM_NAME: str = "Soccer Quiz"
    
    # Email Templates
    PASSWORD_RESET_SUBJECT: str = "Recuperação de Senha - Soccer Quiz"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()
