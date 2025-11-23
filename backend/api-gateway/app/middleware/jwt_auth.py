"""
Middleware de autenticação JWT
Valida tokens JWT e extrai informações do usuário (userId, role)
"""
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import ASGIApp
from jose import jwt, JWTError
from fastapi import status

from app.config import settings


# Lista de rotas públicas que não precisam de autenticação
PUBLIC_ROUTES = [
    "/api/auth/login",
    "/api/auth/logout",
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
]


class JwtAuthMiddleware(BaseHTTPMiddleware):
    """Middleware para validação de tokens JWT"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Verificar se a rota é pública
        path = request.url.path
        
        if self._is_public_route(path):
            return await call_next(request)
        
        # Extrair token do header Authorization
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token não fornecido"}
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Validar token JWT
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Extrair informações do usuário do payload
            user_id = payload.get("sub") or payload.get("userId")
            user_role = payload.get("role", "comum")
            
            # Anexar informações ao estado da requisição
            request.state.user_id = user_id
            request.state.user_role = user_role
            request.state.user = payload
            
        except JWTError as e:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": f"Token inválido: {str(e)}"}
            )
        except Exception as e:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": f"Erro ao validar token: {str(e)}"}
            )
        
        return await call_next(request)
    
    def _is_public_route(self, path: str) -> bool:
        """Verifica se a rota é pública"""
        # Verificar rotas exatas
        if path in PUBLIC_ROUTES:
            return True
        
        # Verificar se começa com alguma rota pública
        for public_route in PUBLIC_ROUTES:
            if path.startswith(public_route):
                return True
        
        return False

