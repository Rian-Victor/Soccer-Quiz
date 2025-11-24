"""
Configurações do Auth Service
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do serviço
    PORT: int = 3000
    
    # Modo debug
    DEBUG: bool = True
    
    # JWT Config
    JWT_SECRET: str = "default-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database - Azure SQL Database ou SQL Server local
    # DATABASE_URL é obrigatória e deve ser fornecida via variável de ambiente
    # Formato: mssql+pyodbc://username:password@server:port/database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no&loginTimeout=30
    DATABASE_URL: str = Field(
        ...,
        description="String de conexão com o banco de dados SQL Server. Obrigatória."
    )
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Valida se DATABASE_URL foi fornecida"""
        if not v or v.strip() == "":
            raise ValueError(
                "DATABASE_URL é obrigatória. Configure no arquivo .env ou variável de ambiente. "
                "Formato: mssql+pyodbc://username:password@server:port/database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no&loginTimeout=30"
            )
        if not v.startswith("mssql+pyodbc://"):
            raise ValueError(
                "DATABASE_URL deve começar com 'mssql+pyodbc://'. "
                f"Valor recebido: {v[:30]}..."
            )
        return v
    
    # User Service URL (para buscar dados do usuário)
    USER_SERVICE_URL: str = "http://user-service:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()

