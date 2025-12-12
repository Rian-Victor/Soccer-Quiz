import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import * # Importa os modelos para serem criados no banco de teste

# Usando SQLite em memória para testes rápidos
# (Simula seu Postgres, mas roda na RAM)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} # Necessário apenas para SQLite
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """
    Fixture que cria um banco novo e limpo para CADA função de teste.
    """
    # 1. Cria as tabelas no banco em memória
    Base.metadata.create_all(bind=engine)
    
    # 2. Abre a sessão
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        # 3. Fecha a sessão
        session.close()
        # 4. Destrói as tabelas (limpeza total)
        Base.metadata.drop_all(bind=engine)