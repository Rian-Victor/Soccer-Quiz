"""
Configurações do User Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do serviço
    PORT: int = 3000
    
    # Modo debug
    DEBUG: bool = True
    
    # Database - Azure SQL Database ou SQL Server local
    # Formato: mssql+pyodbc://username:password@server:port/database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
    DATABASE_URL: str = "mssql+pyodbc://username:password@your-server.database.windows.net:1433/your-database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"
    
    # Password Reset Token Configuration
    RESET_TOKEN_EXPIRE_MINUTES: int = 15  # Token expira em 15 minutos
    
    # Notification Service URL (opcional)
    NOTIFICATION_SERVICE_URL: str = ""  # Ex: http://notification-service:3000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()