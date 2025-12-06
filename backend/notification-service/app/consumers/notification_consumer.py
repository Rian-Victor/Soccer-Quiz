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
            await self.channel.set_qos(prefetch_count=1)
            
            logger.info("✅ Conectado e aguardando mensagens...")
            await queue.consume(self._process_message)
            await asyncio.Future() # Mantém rodando

    async def _process_message(self, message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                body = json.loads(message.body.decode())
                logger.info(f"📨 Recebido: {body.get('type')}")
                
                if body.get('type') == 'PASSWORD_RESET':
                    await self._handle_password_reset(body)
            except Exception as e:
                logger.error(f"❌ Erro processando: {e}")

    async def _handle_password_reset(self, data):
        await EmailService.send_password_reset_email(
            data.get('email'), data.get('token')
        )

    async def close(self):
        if self.connection and not self.connection.is_closed:
            await self.connection.close()