"""
Auth Service - Soccer Quiz
Responsável por login, logout e geração/validação de tokens (JWT e Refresh)
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import uvicorn

from app.config import settings
from app.routers import auth
from app.database import engine, Base

# SRP: este módulo controla apenas o ciclo de vida do serviço, mantendo a lógica de domínio nos routers.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - Criar tabelas
    Base.metadata.create_all(bind=engine)
    print(f"Auth Service iniciado na porta {settings.PORT}")
    print(f"Documentação disponível em: http://localhost:{settings.PORT}/docs")
    yield
    # Shutdown
    print("Auth Service encerrado")


app = FastAPI(
    title="Soccer Quiz Auth Service",
    description="Serviço de autenticação - Login, logout e geração de tokens JWT",
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
app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/", tags=["health"])
async def root():
    """Redireciona para a documentação Swagger"""
    return RedirectResponse(url="/docs")


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

