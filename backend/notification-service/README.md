# Notification Service - Soccer Quiz

Serviço de notificações que consome eventos de uma fila RabbitMQ e envia emails.

## Tecnologias

- **Python 3.11+**
- **FastAPI** - Framework web
- **pika** - Cliente RabbitMQ
- **smtplib** - Envio de emails

## Funcionalidades

- Consome mensagens do RabbitMQ
- Envia emails de reset de senha via SMTP
- Extensível para outros tipos de notificação

## Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Configure seu servidor SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-app-password
```

**Para Gmail:**
- Habilitar "2-Step Verification"
- Gerar "App Password" em https://myaccount.google.com/apppasswords
- Usar a senha gerada como `SMTP_PASSWORD`

### 2. Instalar Dependências

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### 3. Rodar o Serviço

```bash
python main.py
```

Ou com uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 3004
```

## Fluxo de Mensagens

```
1. User Service
   └─> Publica evento "password_reset" no RabbitMQ
       │
       └─> Exchange: notifications
           └─> Queue: password_reset_emails
               │
               └─> Notification Service
                   └─> Consome mensagem
                       └─> Envia email via SMTP
```

### Formato de Mensagem

```json
{
  "type": "password_reset",
  "email": "usuario@example.com",
  "reset_link": "https://app.com/reset?token=abc123...",
  "user_name": "João"
}
```

## Endpoints

### Health Check

```bash
GET http://localhost:3004/health
```

Response:
```json
{"status": "healthy"}
```

### Root

```bash
GET http://localhost:3004/
```

Response:
```json
{
  "service": "notification-service",
  "status": "running",
  "version": "1.0.0"
}
```

## Logs

O serviço imprime logs no console:

```
✅ Conectado ao RabbitMQ
✅ Fila configurada: password_reset_emails
🔄 Aguardando mensagens em password_reset_emails...
📨 Mensagem recebida: password_reset
✅ Email de reset enviado para usuario@example.com
✅ Mensagem processada
```

## Docker

### Build

```bash
docker build -t notification-service:latest .
```

### Run

```bash
docker run -d \
  --name notification-service \
  --network soccer-quiz-network \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/ \
  -e SMTP_USER=seu-email@gmail.com \
  -e SMTP_PASSWORD=sua-app-password \
  -p 3004:3000 \
  notification-service:latest
```

## Troubleshooting

### "Connection refused" ao conectar no RabbitMQ

- Verifique se RabbitMQ está rodando: `docker-compose ps`
- Confirme `RABBITMQ_URL` está correta
- Aguarde RabbitMQ ficar pronto (healthcheck)

### Emails não são enviados

- Verifique `SMTP_USER` e `SMTP_PASSWORD`
- Confirme que o servidor SMTP aceita conexões na porta configurada
- Cheque logs para mensagens de erro
- Se usar Gmail, certifique-se de gerar "App Password" (não use a senha da conta)

### Mensagens acumulam na fila

- Verificar logs do notification-service
- Se houver erro ao enviar email, mensagens são devolvidas à fila (requeue=true)
- Mensagens são reprocessadas automaticamente

## Próximos Passos

- Implementar retry automático com backoff
- Adicionar templates de email customizáveis
- Registrar histórico de emails enviados
- Adicionar outros tipos de notificação (SMS, push)
