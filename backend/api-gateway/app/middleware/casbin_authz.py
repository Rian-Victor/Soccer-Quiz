"""
Middleware de autorização Casbin
Verifica permissões baseadas em roles e políticas
"""
import os
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.types import ASGIApp
from fastapi import status
import casbin

from app.config import settings


class CasbinAuthzMiddleware(BaseHTTPMiddleware):
    """Middleware para verificação de autorização usando Casbin"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.enforcer = None
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Inicializar enforcer se ainda não foi inicializado
        if self.enforcer is None:
            # Obter caminho base do projeto (pasta onde está o main.py)
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, settings.CASBIN_MODEL_PATH)
            policy_path = os.path.join(base_dir, settings.CASBIN_POLICY_PATH)
            
            print(f"[Casbin] Inicializando enforcer: model={model_path}, policy={policy_path}")
            
            try:
                self.enforcer = casbin.Enforcer(
                    model_path,
                    policy_path
                )
                print(f"[Casbin] Enforcer inicializado com sucesso. Políticas carregadas: {len(self.enforcer.get_policy())}")
            except Exception as e:
                print(f"[Casbin] ERRO ao inicializar enforcer: {e}")
                raise
        
        # Rotas de autenticação são permitidas para todos
        path = request.url.path
        if path.startswith("/api/auth/"):
            return await call_next(request)
        
        # Rotas de password reset são públicas (não precisam de autenticação)
        if path.startswith("/api/password/"):
            return await call_next(request)
        
        # Rotas públicas não precisam de autorização
        public_routes = ["/", "/health", "/docs", "/openapi.json", "/redoc"]
        if any(path.startswith(route) for route in public_routes):
            return await call_next(request)
        
        # Se não tem role (usuário não autenticado), bloquear
        user_role = getattr(request.state, "user_role", None)
        if not user_role:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Acesso negado: autenticação necessária"}
            )
        
        # Normalizar path (remover query params)
        normalized_path = path.split("?")[0]
        method = request.method
        
        # Log para debug
        print(f"[Casbin] Verificando autorização: role={user_role}, path={normalized_path}, method={method}")
        
        # Tentar verificar com path exato primeiro
        allowed = self.enforcer.enforce(user_role, normalized_path, method)
        
        # Se não permitido com path exato, tentar com wildcard
        if not allowed:
            # Para rotas com ID (ex: /api/users/123), tentar com wildcard (ex: /api/users/*)
            path_parts = normalized_path.split("/")
            if len(path_parts) > 3:
                # Construir path com wildcard (ex: /api/users/*)
                wildcard_path = "/".join(path_parts[:-1]) + "/*"
                print(f"[Casbin] Tentando com wildcard: {wildcard_path}")
                allowed = self.enforcer.enforce(user_role, wildcard_path, method)
        
        if not allowed:
            print(f"[Casbin] Acesso NEGADO: role={user_role}, path={normalized_path}, method={method}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": f"Acesso negado: você não tem permissão para {method} {normalized_path}"
                }
            )
        
        print(f"[Casbin] Acesso PERMITIDO: role={user_role}, path={normalized_path}, method={method}")
        return await call_next(request)

