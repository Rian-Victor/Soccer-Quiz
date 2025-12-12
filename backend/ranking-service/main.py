"""
Ranking Service - Soccer Quiz
Gerencia leaderboards, rankings e estatísticas agregadas de desempenho.
Consome eventos do Quiz Service e atualiza as tabelas de classificação.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.database import init_db, close_db
from app.messaging.consumer import RabbitMQConsumer
from app.routers import leaderboard_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Inicializando Ranking Service...")
    
    await init_db()
    
    # Inicializa consumer RabbitMQ
    consumer = RabbitMQConsumer()
    await consumer.connect()
    app.state.consumer = consumer
    
    print(f"🚀 Ranking Service iniciado na porta {settings.PORT}")
    print(f"📚 Documentação disponível em: http://localhost:{settings.PORT}/docs")
    
    yield
    
    print("🛑 Encerrando Ranking Service...")
    await consumer.close()
    await close_db()
    print("✅ Ranking Service encerrado com sucesso")


app = FastAPI(
    title="Soccer Quiz - Ranking Service",
    description="Serviço responsável pelo cálculo e gerenciamento de rankings.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE ROTAS ---
app.include_router(leaderboard_routes.router)


@app.get("/", tags=["health"])
async def root():
    """Health check endpoint simples"""
    return {
        "service": "ranking-service",
        "status": "running",
        "version": "1.0.0",
        "features": ["leaderboards", "rankings", "statistics", "rabbitmq-consumer"]
    }


@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint para k8s/docker"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )