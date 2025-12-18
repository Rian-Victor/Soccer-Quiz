"""
Serviço de Proxy - Encaminha requisições para os microsserviços
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import Response, StreamingResponse
import httpx

from app.config import settings


# SRP: ProxyService cuida apenas do encaminhamento das requisições, sem misturar regras de negócio.
class ProxyService:
    """Serviço para fazer proxy de requisições para microsserviços"""
    
    # Mapeamento de serviços para URLs
    SERVICE_URLS = {
        "auth": settings.AUTH_SERVICE_URL,
        "user": settings.USER_SERVICE_URL,
        "quiz": settings.QUIZ_SERVICE_URL,
    }
    
    # Mapeamento de prefixos por serviço
    # Esses prefixos são adicionados ao path antes de fazer proxy
    SERVICE_PREFIXES = {
        "auth": "/auth",  # Auth service espera /auth/login, /auth/logout, etc.
        "user": "/users",  # User service espera /users/{id}, /users/by-email, etc.
        "quiz": "",  # Quiz service não precisa de prefixo adicional (já incluído no path)
    }
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def proxy_request(
        self,
        service: str,
        path: str,
        request: Request
    ) -> Response:
        """
        Faz proxy de uma requisição para um microsserviço
        
        Args:
            service: Nome do serviço (auth, user, quiz)
            path: Caminho do endpoint no microsserviço
            request: Requisição FastAPI original
        
        Returns:
            Resposta do microsserviço
        """
        # Obter URL do serviço
        service_url = self.SERVICE_URLS.get(service)
        if not service_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Serviço '{service}' não configurado"
            )
        
        # Obter prefixo do serviço (se houver)
        service_prefix = self.SERVICE_PREFIXES.get(service, "")
        
        # Construir path completo com prefixo
        if service_prefix:
            # Se o path já começar com o prefixo, não adicionar novamente
            if path and path.startswith(service_prefix):
                full_path = path
            else:
                # Remover barra inicial do path se houver, para evitar duplicação
                clean_path = path.lstrip("/") if path else ""
                # Construir path: /prefixo/caminho
                full_path = f"{service_prefix}/{clean_path}" if clean_path else service_prefix
        else:
            # Sem prefixo, usar o path diretamente
            full_path = f"/{path.lstrip('/')}" if path else ""
        
        # Adicionar query string se houver
        if request.url.query:
            full_path += f"?{request.url.query}"
        
        target_url = f"{service_url}{full_path}"
        
        # Log para debug (pode ser removido após confirmação)
        print(f"[Proxy] Service: {service}, Path recebido: {path}, URL final: {target_url}")
        
        # Preparar headers (filtrar headers relevantes)
        headers = {}
        header_keys_to_forward = [
            "authorization",
            "content-type",
            "accept",
            "accept-encoding",
            "accept-language",
            "user-agent",
            "x-user-id",
            "x-user-role",
        ]
        
        for key in request.headers:
            if key.lower() in header_keys_to_forward:
                headers[key] = request.headers[key]
        
        # Adicionar headers de user_role e user_id do estado da requisição
        # (extraídos pelo JWT middleware)
        if hasattr(request.state, "user_role"):
            headers["X-User-Role"] = request.state.user_role
        
        if hasattr(request.state, "user_id"):
            headers["X-User-Id"] = str(request.state.user_id)
        
        # Ler body da requisição
        body = await request.body()
        
        try:
            # Fazer requisição para o microsserviço
            response = await self.client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                follow_redirects=True,
            )
            # Preparar headers da resposta
            response_headers = {}
            headers_to_forward = [
                "content-type",
                "content-length",
                "content-encoding",
                "access-control-allow-origin",
                "set-cookie",
            ]
            
            for key in response.headers:
                if key.lower() in headers_to_forward:
                    response_headers[key] = response.headers[key]
            
            # Retornar resposta
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=response_headers,
            )
            
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Timeout ao conectar com {service}"
            )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro ao conectar com {service} em {service_url}"
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro ao processar requisição para {service}: {str(e)}"
            )
    
    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()

