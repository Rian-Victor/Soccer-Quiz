import json
import logging
import asyncio
import aio_pika
from aio_pika.exceptions import AMQPConnectionError
from app.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

class EventProducer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.quiz_exchange = None
        self.notification_exchange = None

    async def connect(self, max_retries: int = 5, retry_delay: int = 5):
        """Conecta ao RabbitMQ (chamar no startup do FastAPI)"""
        if self.connection and not self.connection.is_closed:
            return  # Já conectado
        
        for attempt in range(max_retries):
            try:
                self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
                self.channel = await self.connection.channel()
                
                    # 1. Declara a Exchange de Quiz Events
                self.quiz_exchange = await self.channel.declare_exchange(
                    name="quiz_events", # Nome da Exchange 1
                    type=aio_pika.ExchangeType.TOPIC,
                    durable=True
                )

                    # 2. Declara a Exchange de Notificações
                self.notification_exchange = await self.channel.declare_exchange(
                    name="notifications", # Nome da Exchange 2
                    type=aio_pika.ExchangeType.TOPIC,
                    durable=True
                )
                logger.info("✅ Conectado ao RabbitMQ (Producer)")
                return
            
            except (AMQPConnectionError, ConnectionRefusedError) as e:
                logger.warning(
                    f"❌ Falha ao conectar RabbitMQ (tentativa {attempt + 1}/{max_retries}): {e}"
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                else:
                    logger.error("❌ Todas as tentativas de conexão RabbitMQ falharam.")
                    
    async def close(self):
        if self.connection:
            await self.connection.close()
    async def _publish(self, exchange, routing_key: str, payload: dict):
        """Método interno auxiliar para evitar repetição de código"""
        if not exchange:
            logger.warning(f"RabbitMQ Exchange não inicializada. Tentando reconectar...")
            await self.connect()
            if not exchange: 
                logger.error(f"Falha ao enviar mensagem para {routing_key}: Exchange offline.")
                return

        try:
            message = aio_pika.Message(
                body=json.dumps(payload).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json"
            )
            await exchange.publish(message, routing_key=routing_key)
            logger.debug(f"📤 Evento enviado: {routing_key}")
        except Exception as e:
            logger.error(f"❌ Erro crítico ao publicar em {routing_key}: {e}")



    async def publish_quiz_created(self, payload: dict):
        """Publica evento de NOVO quiz criado (Admin) -> Notifications"""
        await self._publish(self.notification_exchange, "quiz.created", payload)

    async def publish_game_finished(self, payload: dict):
        """Publica evento de jogo finalizado -> Ranking Service"""
        await self._publish(self.quiz_exchange, "game.finished", payload)

    async def publish_invite(self, inviter_name: str, target_email: str):
        """Publica evento de convite -> Notifications"""
        payload = {
            "type": "invite",
            "inviter_name": inviter_name,
            "target_email": target_email,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self._publish(self.notification_exchange, "user.invite", payload)

event_producer = EventProducer()