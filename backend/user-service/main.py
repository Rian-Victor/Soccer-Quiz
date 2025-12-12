"""
User Service - Soccer Quiz
Gerencia usuários e suas informações
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.routers import users
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - Criar tabelas
    Base.metadata.create_all(bind=engine)
    print(f" ✅ User Service iniciado na porta {settings.PORT}")
    print(f" ✅ Documentação disponível em: http://localhost:{settings.PORT}/docs")
    yield
    # Shutdown
    print("User Service encerrado")


app = FastAPI(
    title="Soccer Quiz User Service",
    description="Serviço de gerenciamento de usuários - CRUD de usuários",
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
app.include_router(users.router, prefix="/users", tags=["users"])


@app.get("/", tags=["health"])
async def root():
    """Health check endpoint"""
    return {"service": "user-service", "status": "running", "version": "1.0.0"}


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

