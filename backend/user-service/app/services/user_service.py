"""
Serviço de usuários
Gerencia CRUD de usuários e lógica de domínio
"""
from typing import Optional, List, Tuple
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import httpx

from app.models import User, UserRole, PasswordResetToken
from app.interfaces.user_repository import IUserRepository
from app.repositories.user_repository import UserRepository
from app.config import settings

# Contexto para hash de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """Serviço para gerenciar usuários"""
    
    def __init__(self, repository: IUserRepository, db: Session = None):
        self.repository = repository
        self.db = db
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Gera hash da senha usando bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica se a senha está correta"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_user(
        self,
        name: str,
        email: str,
        password: str,
        role: UserRole = UserRole.COMUM
    ) -> User:
        """
        Cria um novo usuário
        
        Args:
            name: Nome do usuário
            email: Email do usuário
            password: Senha em texto plano
            role: Role do usuário (admin/comum)
            
        Returns:
            Usuário criado
        """
        # Verificar se o email já existe
        existing_user = self.repository.get_by_email(email)
        if existing_user:
            raise ValueError(f"Email {email} já está em uso")
        
        # Criar hash da senha
        password_hash = self.hash_password(password)
        
        # Criar usuário
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role.value if hasattr(role, 'value') else role
        )
        
        return self.repository.create(user)
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Busca usuário por ID"""
        return self.repository.get_by_id(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Busca usuário por email"""
        return self.repository.get_by_email(email)
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Lista todos os usuários"""
        return self.repository.get_all(skip=skip, limit=limit)
    
    def update_user(
        self,
        user_id: int,
        name: Optional[str] = None,
        email: Optional[str] = None,
        password: Optional[str] = None,
        role: Optional[UserRole] = None
    ) -> Optional[User]:
        """
        Atualiza um usuário
        
        Args:
            user_id: ID do usuário
            name: Novo nome (opcional)
            email: Novo email (opcional)
            password: Nova senha (opcional)
            role: Nova role (opcional)
            
        Returns:
            Usuário atualizado ou None se não encontrado
        """
        user = self.repository.get_by_id(user_id)
        if not user:
            return None
        
        if name is not None:
            user.name = name
        
        if email is not None:
            # Verificar se o email já está em uso por outro usuário
            existing_user = self.repository.get_by_email(email)
            if existing_user and existing_user.id != user_id:
                raise ValueError(f"Email {email} já está em uso")
            user.email = email
        
        if password is not None:
            user.password_hash = self.hash_password(password)
        
        if role is not None:
            user.role = role
        
        return self.repository.update(user)
    
    def delete_user(self, user_id: int) -> bool:
        """Deleta um usuário"""
        return self.repository.delete(user_id)
    
    # Recuperação de senha
    
    def generate_reset_token(self, email: str) -> Optional[Tuple[str, datetime]]:
        """
        Gera um token de reset de senha único
        
        Args:
            email: Email do usuário
            
        Returns:
            Tupla (token, expira_em) ou None se usuário não existe
        """
        if not self.db:
            raise RuntimeError("Database session not available")
        
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        # Gerar token aleatório de 32 caracteres (256 bits)
        token = secrets.token_urlsafe(32)
        
        # Expiração: 15 minutos (configurável)
        expires_at = datetime.utcnow() + timedelta(
            minutes=getattr(settings, 'RESET_TOKEN_EXPIRE_MINUTES', 15)
        )
        
        # Criar registro de token no banco
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        
        self.db.add(reset_token)
        self.db.commit()
        
        return token, expires_at
    
    def validate_reset_token(self, token: str) -> Optional[User]:
        """
        Valida um token de reset e retorna o usuário se válido
        
        Args:
            token: Token a validar
            
        Returns:
            User se válido, None se inválido/expirado/usado
        """
        if not self.db:
            raise RuntimeError("Database session not available")
        
        reset_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        if not reset_token:
            return None
        
        # Validações
        if reset_token.used:
            return None  # Token já foi usado
        
        if datetime.utcnow() > reset_token.expires_at:
            return None  # Token expirado
        
        # Token válido, retornar o usuário
        user = self.repository.get_by_id(reset_token.user_id)
        if not user:
            return None
        return user
    
    def reset_password(self, token: str, new_password: str) -> Optional[User]:
        """
        Reseta a senha usando um token válido
        
        Args:
            token: Token de reset
            new_password: Nova senha
            
        Returns:
            User se sucesso, None se token inválido
        """
        if not self.db:
            raise RuntimeError("Database session not available")
        
        # Validar token e obter usuário
       
        reset_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).with_for_update().first()  # opcional: trava o registro
        if not reset_token or reset_token.used or datetime.utcnow() > reset_token.expires_at:
            return None

        user = self.repository.get_by_id(reset_token.user_id)
        if not user:
            return None

        # 2. Operação atômica
        try:
            # Atualizar senha
            user.password_hash = self.hash_password(new_password)
            self.db.add(user)

            # Marcar token como usado
            reset_token.used = True
            reset_token.used_at = datetime.utcnow()
            self.db.add(reset_token)

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return user
    
    async def send_reset_email(self, email: str, token: str, reset_url_base: str) -> bool:
        """
        Envia email de reset de senha
        Tenta usar serviço de notificações se disponível, caso contrário envia direto (fake)
        
        Args:
            email: Email do usuário
            token: Token de reset
            reset_url_base: URL base para construir link de reset (ex: https://app.com/reset)
            
        Returns:
            True se sucesso, False se falha
        """
        reset_link = f"{reset_url_base}?token={token}"
        
        # Tentar usar serviço de notificações (futuro)
        notification_service_url = getattr(
            settings, 'NOTIFICATION_SERVICE_URL', None
        )
        
        if notification_service_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{notification_service_url}/send-email",
                        json={
                            "to": email,
                            "subject": "Recuperação de Senha - Soccer Quiz",
                            "template": "password_reset",
                            "variables": {
                                "reset_link": reset_link
                            }
                        },
                        timeout=5.0
                    )
                return True
            except Exception as e:
                print(f" Erro ao usar notification-service: {e}")
                # Continuar com fallback
        
        # Fallback: enviar diretamente (placeholder)
        try:
            print(f"[FAKE EMAIL SENT] Reset token para {email}: {reset_link}")
            # TODO: Implementar SMTP real quando necessário
            return True
        except Exception as e:
            print(f" Erro ao enviar email: {e}")
            return False

