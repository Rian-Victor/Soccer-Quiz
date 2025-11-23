"""
API Gateway para Soccer Quiz
Gerencia roteamento e aplica autenticação/autorização
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.middleware.jwt_auth import JwtAuthMiddleware
from app.middleware.casbin_authz import CasbinAuthzMiddleware
from app.routers import gateway
from app.config import settings

# Configurar middlewares de forma global
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 API Gateway iniciado na porta {settings.PORT}")
    print(f"📚 Documentação disponível em: http://localhost:{settings.PORT}/docs")
    yield
    # Shutdown
    print("API Gateway encerrado")


app = FastAPI(
    title="Soccer Quiz API Gateway",
    description="API Gateway para o Soccer Quiz - Gerencia requisições para auth-service, user-service e quiz-service",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS para permitir requisições do React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Adicionar middlewares de autenticação e autorização
app.add_middleware(JwtAuthMiddleware)
app.add_middleware(CasbinAuthzMiddleware)

# Registrar rotas do gateway
app.include_router(gateway.router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )

