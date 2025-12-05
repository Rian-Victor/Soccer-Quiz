"""
Testes para o fluxo de recuperação de senha do user-service
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import User, PasswordResetToken, UserRole
from app.services.user_service import UserService
from app.repositories.user_repository import UserRepository
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_send_reset_email_success(user_service):
    """Testa o envio de email mockando a chamada externa"""
    email = "test@example.com"
    token = "some_token"
    base_url = "http://localhost:3000/reset"
    
    # Isso garante que o atributo NOTIFICATION_SERVICE_URL tenha valor
    with patch("app.services.user_service.settings") as mock_settings:
        mock_settings.NOTIFICATION_SERVICE_URL = "http://fake-notification-service"
        # Mockando o httpx.AsyncClient para não fazer requisição real
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value.status_code = 200
            
            result = await user_service.send_reset_email(email, token, base_url)
            
            assert result is True
            mock_post.assert_called_once()
            # Verifica se a URL chamada foi a do notification-service (conforme seu código)
            args, _ = mock_post.call_args
            assert "http://fake-notification-service" in args[0]

@pytest.fixture
def test_user(db: Session):
    """Cria um usuário para testes"""
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=UserService.hash_password("tempPassword123"),
        role=UserRole.COMUM.value
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_service(db: Session):
    """Cria uma instância do serviço de usuários"""
    repository = UserRepository(db)
    return UserService(repository, db)


def test_generate_reset_token(user_service, test_user):
    """Testa geração de token de reset"""
    result = user_service.generate_reset_token(test_user.email)
    
    assert result is not None
    token, expires_at = result
    
    # Validações do token
    assert isinstance(token, str)
    assert len(token) > 20  # Token urlsafe de 32 chars geralmente >= 42
    assert isinstance(expires_at, datetime)
    assert expires_at > datetime.utcnow()


def test_generate_reset_token_nonexistent_user(user_service):
    """Testa que gerar token para email inexistente retorna None"""
    result = user_service.generate_reset_token("nonexistent@example.com")
    assert result is None


def test_validate_reset_token_valid(user_service, test_user, db: Session):
    """Testa validação de token válido"""
    # Gerar token
    token_result = user_service.generate_reset_token(test_user.email)
    assert token_result is not None
    token, _ = token_result
    
    # Validar token
    user = user_service.validate_reset_token(token)
    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


def test_validate_reset_token_nonexistent(user_service):
    """Testa validação de token inexistente"""
    user = user_service.validate_reset_token("invalid_token_12345")
    assert user is None


def test_validate_reset_token_expired(user_service, test_user, db: Session):
    """Testa validação de token expirado"""
    # Criar token expirado manualmente
    token = "expired_token_xyz"
    reset_token = PasswordResetToken(
        user_id=test_user.id,
        token=token,
        expires_at=datetime.utcnow() - timedelta(minutes=1)  # Expirou há 1 min
    )
    db.add(reset_token)
    db.commit()
    
    # Tentar validar
    user = user_service.validate_reset_token(token)
    assert user is None


def test_validate_reset_token_already_used(user_service, test_user, db: Session):
    """Testa validação de token já utilizado"""
    # Criar token já usado
    token = "used_token_xyz"
    reset_token = PasswordResetToken(
        user_id=test_user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        used=True,
        used_at=datetime.utcnow()
    )
    db.add(reset_token)
    db.commit()
    
    # Tentar validar
    user = user_service.validate_reset_token(token)
    assert user is None


def test_reset_password_success(user_service, test_user, db: Session):
    """Testa reset de senha bem-sucedido"""
    # Gerar token
    token_result = user_service.generate_reset_token(test_user.email)
    assert token_result is not None
    token, _ = token_result
    
    # Reseta senha
    new_password = "novaSenha123"
    user = user_service.reset_password(token, new_password)
    
    assert user is not None
    assert user.id == test_user.id
    
    # Verificar que senha foi atualizada
    assert UserService.verify_password(new_password, user.password_hash)
    assert not UserService.verify_password("tempPassword123", user.password_hash)
    
    # Verificar que token foi marcado como usado
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).first()
    assert reset_token.used is True
    assert reset_token.used_at is not None


def test_reset_password_invalid_token(user_service):
    """Testa reset com token inválido"""
    user = user_service.reset_password("invalid_token", "newPassword123")
    assert user is None


def test_reset_password_token_already_used(user_service, test_user, db: Session):
    """Testa que token não pode ser reutilizado"""
    # Gerar token
    token_result = user_service.generate_reset_token(test_user.email)
    token, _ = token_result
    
    # Primeira tentativa de reset
    first_reset = user_service.reset_password(token, "password1")
    assert first_reset is not None
    
    # Segunda tentativa com mesmo token
    second_reset = user_service.reset_password(token, "password2")
    assert second_reset is None
    
    # Verificar que a primeira senha foi usada
    user = user_service.get_user_by_id(test_user.id)
    assert UserService.verify_password("password1", user.password_hash)


def test_reset_password_minimum_length(user_service, test_user, db: Session):
    """Testa validação de comprimento mínimo de senha"""
    # Nota: A validação está no router, mas podemos testar que service não falha
    token_result = user_service.generate_reset_token(test_user.email)
    token, _ = token_result
    
    # User service não valida comprimento, apenas hasha
    user = user_service.reset_password(token, "short")
    # Validação deve ocorrer no router, não no service
    assert user is not None


def test_token_uniqueness(user_service, test_user, db: Session):
    """Testa que tokens são únicos"""
    tokens = set()
    
    # Gerar múltiplos tokens
    for _ in range(5):
        # Criar novo user para cada token
        user = User(
            name=f"User {_}",
            email=f"user{_}@example.com",
            password_hash=UserService.hash_password("password"),
            role=UserRole.COMUM.value
        )
        db.add(user)
        db.commit()
        
        token_result = user_service.generate_reset_token(user.email)
        token, _ = token_result
        tokens.add(token)
    
    # Todos os tokens devem ser únicos
    assert len(tokens) == 5


def test_password_hash_different_for_each_call(user_service):
    """Testa que o hash da mesma senha é diferente cada vez (bcrypt salt)"""
    password = "mySamePassword123"
    
    hash1 = UserService.hash_password(password)
    hash2 = UserService.hash_password(password)
    
    # Hashes devem ser diferentes (bcrypt adiciona salt)
    assert hash1 != hash2
    
    # Mas ambos devem validar a mesma senha
    assert UserService.verify_password(password, hash1)
    assert UserService.verify_password(password, hash2)

