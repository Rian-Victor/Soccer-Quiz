"""
Serviço para geração e validação de tokens JWT
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt

from app.config import settings


class JwtService:
    """Serviço para gerenciar tokens JWT"""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Cria um access token JWT
        
        Args:
            data: Dados a serem incluídos no token (ex: {"sub": user_id, "role": "admin"})
            expires_delta: Tempo de expiração. Se None, usa o padrão das configurações
            
        Returns:
            Token JWT codificado
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """
        Cria um refresh token JWT
        
        Args:
            data: Dados a serem incluídos no token (ex: {"sub": user_id})
            
        Returns:
            Token JWT codificado
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        })
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM
        )
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica e decodifica um token JWT
        
        Args:
            token: Token JWT a ser verificado
            
        Returns:
            Payload do token ou None se inválido
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except Exception:
            return None

