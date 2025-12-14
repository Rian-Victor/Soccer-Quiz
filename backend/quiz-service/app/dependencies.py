"""
Dependências do Quiz Service
"""
from fastapi import HTTPException, status, Header
from typing import Optional


async def require_admin_role(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> str:
    """
    Dependência para validar que o usuário tem role de admin.
    O API Gateway valida o JWT e injeta este Header.
    
    Raises:
        HTTPException: 403 se o role não for "admin"
    """
    if not x_user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: role não fornecido"
        )
    
    if x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: apenas administradores podem realizar esta ação"
        )
    
    return x_user_role

