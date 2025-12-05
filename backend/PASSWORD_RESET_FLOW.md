# Password Reset Flow - Soccer Quiz

Documentação do fluxo de recuperação de senha implementado no user-service.

## Visão Geral

O fluxo de recuperação de senha funciona de forma independente do auth-service (sem usar JWT normal). Ele usa tokens únicos, de uso único, com curto tempo de expiração (15 minutos por padrão).

```
React Native App
    ↓
API Gateway (localhost:3000) [Public Routes]
    ↓
user-service (localhost:3001)
    ├→ POST /password/forgot (public)
    ├→ POST /password/reset (public)
    └→ GET /password/validate-token (public)
```

## Endpoints

### 1. Solicitar Reset de Senha (Public)
**POST** `/api/password/forgot`

Inicia o processo de recuperação de senha. Gera um token único e envia email.

**Request:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Se o email existe na base, você receberá um link para redefinir a senha",
  "reset_url_template": "https://app.example.com/reset-password?token={token}"
}
```

**Notas:**
- Sempre retorna sucesso (por segurança - não expõe se email existe)
- Token é enviado por email (ou placeholder se notification-service não estiver disponível)
- Token válido por 15 minutos

### 2. Redefinir Senha (Public)
**POST** `/api/password/reset`

Redefine a senha usando um token válido.

**Request:**
```json
{
  "token": "gCd5YL9z...",
  "new_password": "novaSenha123"
}
```

**Response (200 OK):**
```json
{
  "message": "Senha redefinida com sucesso",
  "user_id": 42
}
```

**Errors:**
- `401 Unauthorized`: Token inválido, expirado ou já utilizado
- `400 Bad Request`: Senha com menos de 8 caracteres

**Notas:**
- Senha deve ter no mínimo 8 caracteres
- Token é consumido (pode ser usado apenas uma vez)
- Após usar, o token não pode mais ser utilizado

### 3. Validar Token (Public)
**GET** `/api/password/validate-token?token={token}`

Valida um token de reset sem resumi-lo. Útil para o front-end verificar se é válido antes de exibir o formulário.

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "Token válido",
  "user_id": 42,
  "email": "usuario@example.com"
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Token inválido, expirado ou já utilizado"
}
```

## Database Schema

### Tabela: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    used BIT NOT NULL DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);
```

## Modelo de Dados

Adicionado em `backend/user-service/app/models.py`:

```python
class PasswordResetToken(Base):
    """Modelo para tokens de reset de senha"""
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    used_at = Column(DateTime, nullable=True)
    used = Column(Boolean, default=False, nullable=False)
```

## Configuração

### Variáveis de Ambiente

Em `.env` do user-service:

```
# Password Reset Token Configuration
RESET_TOKEN_EXPIRE_MINUTES=15

# Notification Service URL (opcional)
NOTIFICATION_SERVICE_URL=http://notification-service:3000
```

Editar em `backend/user-service/app/config.py` se quiser alterar os padrões.

## Fluxo de Requisição Completo

### 1. Usuário solicita reset
```bash
curl -X POST http://localhost:3000/api/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com"}'
```

**O que acontece:**
1. Gateway roteia para user-service (rota pública)
2. user-service gera token aleatório (32 caracteres, URL-safe)
3. Token é salvo em `password_reset_tokens` com `expires_at = agora + 15 min`
4. Email é enviado com link: `https://app.example.com/reset?token=gCd5YL9z...`

### 2. Usuário valida token (opcional)
```bash
curl http://localhost:3000/api/password/validate-token?token=gCd5YL9z...
```

**Retorna:**
```json
{"valid": true, "user_id": 42, "email": "usuario@example.com"}
```

### 3. Usuário redefine senha
```bash
curl -X POST http://localhost:3000/api/password/reset \
  -H "Content-Type: application/json" \
  -d '{"token": "gCd5YL9z...", "new_password": "novaSenha123"}'
```

**O que acontece:**
1. Gateway roteia para user-service (rota pública)
2. user-service valida token:
   - Existe?
   - Não foi usado ainda?
   - Não expirou?
3. Se válido:
   - Atualiza `password_hash` do usuário
   - Marca token como usado: `used = true`, `used_at = agora`
4. Senha é hasheada com bcrypt
5. Retorna sucesso

## Email (Integração)

### Com Notification Service (Futuro)
Quando implementar `notification-service`, o user-service tentará:

```python
POST http://notification-service:3000/send-email
{
    "to": "usuario@example.com",
    "subject": "Recuperação de Senha - Soccer Quiz",
    "template": "password_reset",
    "variables": {
        "reset_link": "https://app.example.com/reset?token=..."
    }
}
```

### Fallback (Atual)
Se `NOTIFICATION_SERVICE_URL` não estiver configurado, o sistema faz print no console (placeholder):

```
📧 [FAKE EMAIL SENT] Reset token para usuario@example.com: https://app.example.com/reset?token=...
```

## Segurança

### Token Design
- **Aleatório**: Gerado com `secrets.token_urlsafe(32)` (256 bits de entropia)
- **Único**: Armazenado como UNIQUE no banco
- **Curta vida**: 15 minutos de expiração
- **Uso único**: Marcado como `used = true` após consumo
- **Não reutilizável**: Tentativas com token já usado falham com `401`

### Senhas
- **Hash**: Bcrypt com Salt automático (passlib)
- **Mínimo**: 8 caracteres (validado)
- **Não expõe emails**: Endpoint `/forgot` sempre retorna sucesso (por segurança)

### HTTPS (Produção)
- Links de reset devem estar em HTTPS
- Token deve ser passado como parâmetro ou body (não em header)
- Configurar `RESET_TOKEN_EXPIRE_MINUTES` menor se necessário (ex: 10 min)

## Limpeza de Tokens Expirados (Opcional)

Adicionar cronjob ou tarefa agendada para limpar tokens antigos:

```python
# Em background task
def cleanup_expired_tokens():
    db.query(PasswordResetToken).filter(
        PasswordResetToken.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
```

## Testing

### Teste Completo (sem email real)

```python
# 1. Solicitar reset
curl -X POST http://localhost:3001/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Pegar token do console ou DB (em dev)
SELECT token FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;

# 3. Validar token
curl "http://localhost:3001/password/validate-token?token=TOKEN_AQUI"

# 4. Redefinir senha
curl -X POST http://localhost:3001/password/reset \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_AQUI", "new_password": "senhaNovaSegura123"}'

# 5. Tentar usar token novamente (deve falhar)
curl "http://localhost:3001/password/validate-token?token=TOKEN_AQUI"
# Retorna: {"valid": false, ...}
```

## Alterações de Código

### Arquivos Modificados
- `backend/user-service/app/models.py` - Adicionado modelo `PasswordResetToken`
- `backend/user-service/app/services/user_service.py` - Adicionados métodos de reset
- `backend/user-service/app/routers/users.py` - Adicionadas 3 novas rotas
- `backend/user-service/app/config.py` - Adicionadas variáveis de configuração
- `backend/api-gateway/app/routers/gateway.py` - Adicionadas rotas de proxy
- `backend/api-gateway/app/middleware/jwt_auth.py` - Adicionadas rotas públicas

## Próximos Passos

1. **Email Real**: Implementar SMTP ou integrar com serviço de email (SendGrid, AWS SES)
2. **Notification Service**: Criar microsserviço dedicado para notificações
3. **Logs**: Adicionar logging de tentativas de reset (sucesso/falha)
4. **Métricas**: Monitorar taxa de reset por hora (possível brute force?)
5. **Rate Limiting**: Limitar requisições de reset por email (ex: 3 por hora)
6. **Audit**: Registrar quem resetou senhas (para auditoria)

## Referências Internas

- `backend/user-service/app/services/user_service.py` - Classe `UserService` com métodos de reset
- `backend/auth-service/app/services/jwt_service.py` - Para comparação com JWT (diferente!)
- `backend/api-gateway/app/middleware/jwt_auth.py` - PUBLIC_ROUTES lista
