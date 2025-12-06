# Message Broker Integration - RabbitMQ

Implementação de Message Broker usando RabbitMQ para desacoplar o envio de emails do fluxo de reset de senha.

## Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│ React Native App                                         │
│                                                          │
│ 1. POST /api/password/forgot                           │
│    └─> email: "usuario@example.com"                    │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP
                     ▼
┌──────────────────────────────────────────────────────────┐
│ API Gateway (3000)                                       │
│                                                          │
│ Rota pública: /api/password/forgot                      │
│ └─> Proxy: user-service:3000/password/forgot            │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP
                     ▼
┌──────────────────────────────────────────────────────────┐
│ User Service (3001)                                      │
│                                                          │
│ POST /password/forgot                                   │
│ ├─> Gera token único (32 caracteres, válido 15 min)    │
│ ├─> Salva em password_reset_tokens table               │
│ └─> Publica evento no RabbitMQ                         │
│     └─> {                                               │
│           "type": "password_reset",                     │
│           "email": "usuario@example.com",              │
│           "reset_link": "https://app.com/reset?token=...",
│           "user_name": "João"                         │
│         }                                               │
└────────────────────┬─────────────────────────────────────┘
                     │ AMQP
                     ▼
┌──────────────────────────────────────────────────────────┐
│ RabbitMQ Message Broker (5672)                           │
│                                                          │
│ Exchange: notifications                                 │
│  └─> Type: direct                                       │
│       └─> Routing Key: email.password_reset            │
│           └─> Queue: password_reset_emails             │
│               └─> [Message 1] {password_reset...}      │
│               └─> [Message 2] {password_reset...}      │
│               └─> [Message N] {...}                    │
│                                                          │
│ Management UI: http://localhost:15672                   │
│ Credenciais: guest / guest                             │
└────────────────────┬─────────────────────────────────────┘
                     │ AMQP
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Notification Service (3004)                              │
│                                                          │
│ 1. Conecta ao RabbitMQ                                  │
│ 2. Escuta a fila: password_reset_emails                │
│ 3. Ao receber mensagem:                                 │
│    ├─> Extrai email, reset_link                        │
│    ├─> Conecta ao servidor SMTP                        │
│    ├─> Envia email HTML formatado                      │
│    └─> Confirma processamento (ACK)                    │
│                                                          │
│ Se falhar:                                              │
│    └─> Retorna mensagem à fila (NACK + requeue)       │
│        └─> Será reprocessada depois                    │
└──────────────────────────────────────────────────────────┘
```

## Benefícios desta Arquitetura

### 1. **Desacoplamento**
- User Service não conhece SMTP, senhas, servidores de email
- Notification Service é independente
- Se notification-service cair, usuário consegue pedir reset normalmente

### 2. **Resiliência**
- Mensagens ficam na fila se notification-service estiver down
- Quando serviço voltar, processa tudo automaticamente
- Retry automático com requeue

### 3. **Escalabilidade**
- Múltiplas instâncias de notification-service podem consumir da mesma fila
- Cada mensagem é processada por apenas 1 consumidor
- Load balancing automático

### 4. **Auditoria**
- Histórico de tentativas fica no RabbitMQ
- Logs centralizados

## Setup Local

### 1. Adicionar RabbitMQ ao Docker Compose

✅ Já feito em `backend/docker-compose.yml`:

```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"    # AMQP
    - "15672:15672"  # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
```

### 2. Criar notification-service

✅ Estrutura criada em `backend/notification-service/`:

```
notification-service/
├── app/
│   ├── config.py
│   ├── services/
│   │   └── email_service.py
│   └── consumers/
│       └── notification_consumer.py
├── main.py
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

### 3. Configurar Variáveis de Ambiente

#### Arquivo `.env` do notification-service:

```bash
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password
SMTP_FROM_EMAIL=noreply@soccer-quiz.com
```

**Para Gmail:**
1. Ir para https://myaccount.google.com/apppasswords
2. Gerar "App Password"
3. Usar a senha gerada como `SMTP_PASSWORD`

### 4. Iniciar com Docker Compose

```bash
cd backend
docker-compose up -d

# Verificar logs
docker-compose logs -f notification-service
docker-compose logs -f rabbitmq
```

### 5. Acessar Management UI do RabbitMQ

```
http://localhost:15672
Usuário: guest
Senha: guest
```

## Fluxo de Teste Completo

### 1. Solicitar Reset de Senha

```bash
curl -X POST http://localhost:3000/api/password/forgot \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Response:**
```json
{
  "message": "Se o email existe na base, você receberá um link para redefinir a senha",
  "reset_url_template": "https://app.example.com/reset-password?token={token}"
}
```

### 2. Verificar RabbitMQ Management UI

- Ir para http://localhost:15672
- Ir para "Queues"
- Procurar "password_reset_emails"
- Deve haver 1 mensagem "Ready"

### 3. Verificar Logs do Notification Service

```bash
docker-compose logs notification-service
```

Esperado:
```
📨 Mensagem recebida: password_reset
📧 Email enviado para test@example.com
✅ Mensagem processada
```

### 4. Verificar Email

- Aguardar alguns segundos
- Verificar pasta de entrada / spam do email
- Email deve conter link de reset com token

### 5. Redefinir Senha

```bash
# Pegar token do email ou do banco de dados
curl -X POST http://localhost:3000/api/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "gCd5YL9z...",
    "new_password": "novaSenha123"
  }'
```

## Estrutura de Código

### User Service (Produtor)

**Arquivo:** `backend/user-service/app/messaging/rabbitmq_producer.py`

```python
from app.messaging.rabbitmq_producer import RabbitMQProducer

# Publicar evento
success = RabbitMQProducer.publish_password_reset_event(
    email="usuario@example.com",
    reset_link="https://app.com/reset?token=abc",
    user_name="João"
)
```

**No user_service.py:**

```python
async def send_reset_email(self, email: str, token: str, reset_url_base: str) -> bool:
    """
    Publica evento no RabbitMQ (não envia email direto)
    """
    reset_link = f"{reset_url_base}?token={token}"
    
    return RabbitMQProducer.publish_password_reset_event(
        email=email,
        reset_link=reset_link,
        user_name=self.get_user_by_email(email).name
    )
```

### Notification Service (Consumidor)

**Arquivo:** `backend/notification-service/app/consumers/notification_consumer.py`

```python
class NotificationConsumer:
    """Consome mensagens da fila RabbitMQ"""
    
    async def start(self):
        """Inicia consumer e escuta a fila"""
        await self._connect()
        await self._setup_queue()
        await self._start_consuming()
    
    def _message_callback(self, ch, method, properties, body):
        """Processador de mensagens"""
        message = json.loads(body)
        
        if message['type'] == 'password_reset':
            asyncio.run(self._handle_password_reset(message))
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
```

**Arquivo:** `backend/notification-service/app/services/email_service.py`

```python
class EmailService:
    """Envia emails via SMTP"""
    
    @staticmethod
    async def send_password_reset_email(
        to_email: str,
        reset_link: str,
        user_name: str = None
    ) -> bool:
        """Envia email de reset de senha"""
        html_body = EmailService._build_password_reset_html(
            reset_link, user_name
        )
        await EmailService._send_smtp(
            to_email=to_email,
            subject="Recuperação de Senha - Soccer Quiz",
            html_body=html_body
        )
```

## Troubleshooting

### RabbitMQ não conecta

```bash
# Verificar se RabbitMQ está rodando
docker-compose ps

# Verificar logs
docker-compose logs rabbitmq

# Reiniciar
docker-compose restart rabbitmq
```

### Notification Service não consome mensagens

```bash
# Logs detalhados
docker-compose logs -f notification-service

# Verificar se está conectado ao RabbitMQ
docker-compose logs notification-service | grep "Conectado"

# Se falhar, verificar RABBITMQ_URL
```

### Emails não são enviados

```bash
# Verificar SMTP_USER e SMTP_PASSWORD
docker-compose logs notification-service

# Se usar Gmail, confirmar que gerou App Password
# (não é a senha da conta)

# Testar conexão SMTP manualmente
python -m smtplib --test smtp.gmail.com:587
```

### Mensagens acumulando na fila

1. Abrir RabbitMQ Management UI (http://localhost:15672)
2. Ir para "Queues"
3. Ver quantas mensagens estão "Ready"
4. Se muitas:
   - Verificar logs do notification-service
   - Se erro, corrigir e reiniciar serviço
   - Mensagens serão reprocessadas automaticamente

## Próximos Passos

### Curto Prazo
- [ ] Testar fluxo completo
- [ ] Validar emails chegam corretamente
- [ ] Monitorar logs

### Médio Prazo
- [ ] Implementar retry com backoff exponencial
- [ ] Adicionar métricas (quantos emails enviados)
- [ ] Adicionar templates de email customizáveis
- [ ] Registrar histórico de emails

### Longo Prazo
- [ ] Suportar outros tipos de notificação (SMS, push)
- [ ] Dashboard de notificações
- [ ] Dead letter queue para mensagens que falham permanentemente

## Referências

- RabbitMQ: https://www.rabbitmq.com/
- pika (Python client): https://pika.readthedocs.io/
- Direct Exchange: https://www.rabbitmq.com/tutorials/amqp-concepts.html
