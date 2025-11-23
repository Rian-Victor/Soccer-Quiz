"""
Serviço de Proxy - Encaminha requisições para os microsserviços
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import Response, StreamingResponse
import httpx

from app.config import settings


class ProxyService:
    """Serviço para fazer proxy de requisições para microsserviços"""
    
    # Mapeamento de serviços para URLs
    SERVICE_URLS = {
        "auth": settings.AUTH_SERVICE_URL,
        "user": settings.USER_SERVICE_URL,
        "quiz": settings.QUIZ_SERVICE_URL,
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
        
        # Construir URL completa
        full_path = f"/{path}" if path else ""
        if request.url.query:
            full_path += f"?{request.url.query}"
        
        target_url = f"{service_url}{full_path}"
        
        # Preparar headers (filtrar headers relevantes)
        headers = {}
        header_keys_to_forward = [
            "authorization",
            "content-type",
            "accept",
            "accept-encoding",
            "accept-language",
            "user-agent",
        ]
        
        for key in header_keys_to_forward:
            value = request.headers.get(key)
            if value:
                headers[key] = value
        
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
            
            # Preparar headers da resposta (filtrar alguns headers)
            response_headers = {}
            headers_to_forward = [
                "content-type",
                "content-length",
                "content-encoding",
            ]
            
            for key in headers_to_forward:
                value = response.headers.get(key)
                if value:
                    response_headers[key] = value
            
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

