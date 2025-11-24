"""
Configurações do API Gateway
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Porta do API Gateway
    PORT: int = 3000
    
    # Modo debug
    DEBUG: bool = True
    
    # JWT Secret (deve ser o mesmo usado pelo auth-service)
    JWT_SECRET: str = "default-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    
    # URLs dos microsserviços
    AUTH_SERVICE_URL: str = "http://auth-service:3000"
    USER_SERVICE_URL: str = "http://user-service:3000"
    QUIZ_SERVICE_URL: str = "http://quiz-service:3000"
    
    # Caminho para arquivos Casbin
    CASBIN_MODEL_PATH: str = "app/casbin/rbac_model.conf"
    CASBIN_POLICY_PATH: str = "app/casbin/policy.csv"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    return Settings()


settings = get_settings()

