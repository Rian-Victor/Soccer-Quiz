"""
Configuração do banco de dados MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

from app.config import settings

# Cliente MongoDB global
client = AsyncIOMotorClient(settings.MONGODB_URL)
database = client[settings.QUIZ_DB_NAME]


async def init_db():
    """Inicializa conexão com MongoDB"""
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB]
    print(f"Conectado ao MongoDB: {settings.MONGODB_DB}")


async def close_db():
    """Fecha conexão com MongoDB"""
    global client
    if client:
        client.close()
        print("Conexão com MongoDB fechada")


def get_database():
    """Retorna instância do banco de dados"""
    return database

