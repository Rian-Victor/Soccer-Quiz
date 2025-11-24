"""
Configurações do User Service
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
    
    class Config:
        env_file = "../.env"  # Busca o .env na pasta backend/
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()