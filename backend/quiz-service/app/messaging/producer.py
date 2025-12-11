# quiz-service/app/events/producer.py

import json
import logging
import aio_pika
from app.config import settings # Assumindo que você tem RABBITMQ_URL aqui

logger = logging.getLogger(__name__)

class EventProducer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None

    async def connect(self):
        """Conecta ao RabbitMQ (chamar no startup do FastAPI)"""
        try:
            self.connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            
            # Declara a exchange (canal de transmissão)
            self.exchange = await self.channel.declare_exchange(
                "quiz_events", 
                aio_pika.ExchangeType.TOPIC,
                durable=True
            )
            logger.info("✅ Conectado ao RabbitMQ (Producer)")
        except Exception as e:
            logger.error(f"❌ Falha ao conectar RabbitMQ: {e}")

    async def close(self):
        if self.connection:
            await self.connection.close()

    async def publish_game_finished(self, payload: dict):
        """Publica evento de jogo finalizado"""
        if not self.exchange:
            logger.warning("RabbitMQ não conectado, evento perdido!")
            return

        message = aio_pika.Message(
            body=json.dumps(payload).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )
        
        # Routing Key: define quem vai receber (tópico)
        await self.exchange.publish(message, routing_key="game.finished")
        logger.debug(f"📤 Evento game.finished enviado: {payload.get('session_id')}")

producer = EventProducer()