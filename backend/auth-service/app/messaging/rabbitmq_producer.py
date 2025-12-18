"""
Produtor RabbitMQ Assíncrono
Publica eventos de notificação para a fila
"""
import aio_pika
import json
import logging
from typing import Dict, Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class RabbitMQProducer:
    """Produtor assíncrono de mensagens para RabbitMQ"""
    
    _connection: Optional[aio_pika.RobustConnection] = None
    _channel: Optional[aio_pika.Channel] = None
    
    @classmethod
    async def _get_connection(cls):
        """Obtém ou cria uma conexão"""
        if cls._connection is None or cls._connection.is_closed:
            try:
                cls._connection = await aio_pika.connect_robust(
                    settings.RABBITMQ_URL
                )
                logger.info("✅ Conectado ao RabbitMQ")
            except Exception as e:
                logger.error(f"❌ Erro ao conectar ao RabbitMQ: {e}")
                raise
        return cls._connection
    
    @classmethod
    async def _get_channel(cls):
        """Obtém ou cria um channel"""
        if cls._channel is None or cls._channel.is_closed:
            connection = await cls._get_connection()
            cls._channel = await connection.channel()
            
            # Declarar exchange 
            await cls._channel.declare_exchange(
                name=settings.RABBITMQ_EXCHANGE,
                type=aio_pika.ExchangeType.TOPIC, 
                durable=True
            )
        
        return cls._channel
    
    @classmethod
    async def publish_event(cls, routing_key: str, message: Dict[str, Any]) -> bool:
        """
        Método genérico para publicar qualquer evento.
        """
        try:
            channel = await cls._get_channel()
            exchange = await channel.get_exchange(settings.RABBITMQ_EXCHANGE)
            
            await exchange.publish(
                aio_pika.Message(
                    body=json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json"
                ),
                routing_key=routing_key 
            )
            logger.info(f"📤 Evento enviado: {routing_key}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao publicar {routing_key}: {e}")
            return False


    @classmethod
    async def publish_password_reset(cls, email: str, token: str, user_name: str = None):
        """Helper para o Auth-Service"""
        payload = {
            "type": "password_reset",
            "email": email,
            "token": token,
            "user_name": user_name
        }
        
        return await cls.publish_event("auth.password_reset", payload)

    @classmethod
    async def close(cls):
        """Fecha a conexão"""
        if cls._connection and not cls._connection.is_closed:
            await cls._connection.close()
            logger.info("🔌 Conexão RabbitMQ fechada")