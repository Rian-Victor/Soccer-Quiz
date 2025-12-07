import json
import asyncio
import logging
import aio_pika
from typing import Dict, Any

from app.config import settings
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class NotificationConsumer:
    def __init__(self):
        self.rabbitmq_url = settings.RABBITMQ_URL
        self.queue_name = settings.RABBITMQ_QUEUE
        self.exchange_name = settings.RABBITMQ_EXCHANGE
        self.routing_key = settings.RABBITMQ_ROUTING_KEY
        self.connection = None
        self.channel = None

    async def start(self):
        while True:
            try:
                await self._connect_and_consume()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Erro RabbitMQ: {e}. Retentando em 5s...")
                await asyncio.sleep(5)

    async def _connect_and_consume(self):
        logger.info(f"🔌 Conectando ao RabbitMQ...")
        self.connection = await aio_pika.connect_robust(self.rabbitmq_url)
        
        async with self.connection:
            self.channel = await self.connection.channel()
            
            # Declarações
            exchange = await self.channel.declare_exchange(
                self.exchange_name, aio_pika.ExchangeType.DIRECT, durable=True
            )
            queue = await self.channel.declare_queue(self.queue_name, durable=True)
            await queue.bind(exchange, routing_key=self.routing_key)
            await queue.bind(exchange, routing_key="user.registered") 
            
            logger.info("✅ Bindings configurados: Reset de Senha e Novo Usuário")
            await self.channel.set_qos(prefetch_count=1)
            
            logger.info("✅ Conectado e aguardando mensagens...")
            await queue.consume(self._process_message)
            await asyncio.Future() # Mantém rodando

    async def _process_message(self, message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                body = message.body.decode()
                data = json.loads(body)
                event_type = data.get('type') # Lê o tipo do evento

                logger.info(f"📦 Payload Completo: {data}")
                logger.info(f"📨 Processando evento: {event_type}")

                if event_type == 'PASSWORD_RESET':
                    await self._handle_password_reset(data)
                
                elif event_type == 'USER_REGISTERED':
                    await self._handle_welcome_email(data)
                
                else:
                    logger.warning(f"⚠️ Evento desconhecido ignorado: {event_type}")

            except Exception as e:
                logger.error(f"❌ Erro processando mensagem: {e}")



    # Adicione este novo método handler:
    async def _handle_welcome_email(self, data):
        email = data.get('email')
        name = data.get('name')
        
        if email and name:
            await EmailService.send_welcome_email(email, name)
            logger.info(f"✅ Email de boas-vindas enviado para {email}")
        else:
            logger.error(f"❌ DADOS FALTANDO! Email: {email}, Nome: {name}")

    async def _handle_password_reset(self, data: Dict[str, Any]):
        # 1. Extrair dados
        email = data.get('email')
        token = data.get('token')
        name = data.get('name') 
        
        # 2. Validação (PRIMEIRO passo)
        # Se não tiver email ou token, aborta imediatamente
        if not email or not token:
            logger.error(f"❌ Dados inválidos para reset de senha: {data}")
            return

        # 3. Montar o Link (Só faz isso se passou na validação)

        base_url = settings.FRONTEND_URL
        path = settings.RESET_PASSWORD_PATH

        # Monta: http://localhost:3000/redefinir-senha?token=XYZ
        full_reset_link = f"{base_url}{path}?token={token}"

        logger.info(f"🔗 Gerando link para: {email} -> {full_reset_link}")

        # 4. Enviar E-mail (Uma única vez)
        try:
            success = await EmailService.send_password_reset_email(
                to_email=email,
                reset_link=full_reset_link,
                user_name=name
            )
            
            # 5. Verificar Resultado
            if success:
                logger.info(f"✅ [Email] Recuperação de senha enviada para {email}")
            else:
                logger.error(f"⚠️ [Email] Falha ao entregar recuperação para {email} (Verifique logs do EmailService)")
                
        except Exception as e:
            logger.error(f"❌ Erro crítico ao chamar serviço de email: {e}")