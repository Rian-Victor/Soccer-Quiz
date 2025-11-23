"""
Configuração do banco de dados SQL Server
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

from app.config import settings

# Criar engine para SQL Server
# Azure SQL Database requer alguns parâmetros específicos
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "timeout": 30,
        "autocommit": False,
    },
    echo=False,  # Setar True para debug de queries SQL
)

# Criar SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


# Event listener para SQL Server (ajustar algumas configurações se necessário)
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Configurações iniciais para SQL Server se necessário"""
    pass


def get_db():
    """Dependência para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

