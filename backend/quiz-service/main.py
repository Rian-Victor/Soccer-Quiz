"""
Quiz Service - Soccer Quiz
Gerencia conteúdo do jogo (Times, Perguntas, Respostas), Gameplay e Ranking.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.database import init_db, close_db
from app.messaging.producer import producer 

from app.routers import teams, questions, answers       
from app.routers import quiz_routes, leaderboard_routes 


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Inicializando conexões...")

    await init_db()

    await producer.connect()
    
    print(f"🚀 Quiz Service iniciado na porta {settings.PORT}")
    print(f"📚 Documentação disponível em: http://localhost:{settings.PORT}/docs")
    
    yield 
    print("🛑 Encerrando conexões...")
    await producer.close()
    await close_db()             
    print("✅ Quiz Service encerrado com sucesso")


app = FastAPI(
    title="Soccer Quiz - Quiz Service",
    description="Serviço responsável pelo conteúdo, lógica do jogo e ranking.",
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

# 1. Rotas Administrativas (CRUD Backoffice)
app.include_router(teams.router, prefix="/teams", tags=["teams"])
app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(answers.router, prefix="/answers", tags=["answers"])

# 2. Rotas de Gameplay (App Mobile)
app.include_router(quiz_routes.router)
app.include_router(leaderboard_routes.router)



@app.get("/", tags=["health"])
async def root():
    """Health check endpoint simples"""
    return {
        "service": "quiz-service", 
        "status": "running", 
        "version": "1.0.0",
        "features": ["crud", "gameplay", "leaderboard", "rabbitmq"]
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