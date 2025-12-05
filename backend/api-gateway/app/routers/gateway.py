"""
Router do Gateway - Roteia requisições para os microsserviços
"""
from fastapi import APIRouter, Request

from app.services.proxy import ProxyService

router = APIRouter()
proxy_service = ProxyService()


@router.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_auth(path: str, request: Request):
    """Roteia requisições para auth-service"""
    return await proxy_service.proxy_request("auth", path, request)


# ========== PASSWORD RESET ROUTES (Public) ==========

@router.post("/password/forgot")
async def forgot_password(request: Request):
    """
    Inicia recuperação de senha
    Roteia para user-service
    """
    return await proxy_service.proxy_request("user", "password/forgot", request)


@router.post("/password/reset")
async def reset_password(request: Request):
    """
    Redefine a senha usando token
    Roteia para user-service
    """
    return await proxy_service.proxy_request("user", "password/reset", request)


@router.get("/password/validate-token")
async def validate_token(request: Request):
    """
    Valida um token de reset
    Roteia para user-service
    """
    return await proxy_service.proxy_request("user", "password/validate-token", request)


@router.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_users(path: str, request: Request):
    """Roteia requisições para user-service"""
    return await proxy_service.proxy_request("user", path, request)


@router.api_route("/user/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_user(path: str, request: Request):
    """Roteia requisições para user-service (alias)"""
    return await proxy_service.proxy_request("user", path, request)


@router.api_route("/quiz/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_quiz(path: str, request: Request):
    """Roteia requisições para quiz-service"""
    return await proxy_service.proxy_request("quiz", path, request)


@router.api_route("/teams/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_teams(path: str, request: Request):
    """Roteia requisições para quiz-service - Teams"""
    full_path = f"teams/{path}" if path else "teams"
    return await proxy_service.proxy_request("quiz", full_path, request)


@router.api_route("/teams", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_teams_root(request: Request):
    """Roteia requisições para quiz-service - Teams (root)"""
    return await proxy_service.proxy_request("quiz", "teams", request)


@router.api_route("/questions/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_questions(path: str, request: Request):
    """Roteia requisições para quiz-service - Questions"""
    full_path = f"questions/{path}" if path else "questions"
    return await proxy_service.proxy_request("quiz", full_path, request)


@router.api_route("/questions", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_questions_root(request: Request):
    """Roteia requisições para quiz-service - Questions (root)"""
    return await proxy_service.proxy_request("quiz", "questions", request)


@router.api_route("/answers/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_answers(path: str, request: Request):
    """Roteia requisições para quiz-service - Answers"""
    full_path = f"answers/{path}" if path else "answers"
    return await proxy_service.proxy_request("quiz", full_path, request)


@router.api_route("/answers", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_answers_root(request: Request):
    """Roteia requisições para quiz-service - Answers (root)"""
    return await proxy_service.proxy_request("quiz", "answers", request)

