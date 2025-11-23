"""
Quiz Service - Soccer Quiz
Gerencia conteúdo do jogo (Times, Perguntas e Respostas)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.routers import teams, questions, answers
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - Inicializar conexão com MongoDB
    await init_db()
    print(f"🚀 Quiz Service iniciado na porta {settings.PORT}")
    print(f"📚 Documentação disponível em: http://localhost:{settings.PORT}/docs")
    yield
    # Shutdown
    print("🛑 Quiz Service encerrado")


app = FastAPI(
    title="Soccer Quiz Quiz Service",
    description="Serviço de conteúdo do quiz - Times, Perguntas e Respostas",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rotas
app.include_router(teams.router, prefix="/teams", tags=["teams"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(answers.router, prefix="/answers", tags=["answers"])


@app.get("/", tags=["health"])
async def root():
    """Health check endpoint"""
    return {"service": "quiz-service", "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )

