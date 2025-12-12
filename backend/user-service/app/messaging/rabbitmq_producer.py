"""
Produtor RabbitMQ Assíncrono (USER SERVICE)
Publica eventos de registro de usuário (Boas-vindas)
"""
import aio_pika
import json
import logging
from typing import Optional
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class RabbitMQProducer:
    """
    Produtor assíncrono para o User Service.
    Responsabilidade: Notificar quando um usuário é criado.
    """
    
    _connection: Optional[aio_pika.RobustConnection] = None
    _channel: Optional[aio_pika.Channel] = None
    
    @classmethod
    async def _get_connection(cls):
        """Obtém ou cria uma conexão (Singleton)"""
        if cls._connection is None or cls._connection.is_closed:
            try:
                cls._connection = await aio_pika.connect_robust(
                    settings.RABBITMQ_URL
                )
                logger.info("✅ User Service: Conectado ao RabbitMQ")
            except Exception as e:
                logger.error(f"❌ User Service: Erro ao conectar RabbitMQ: {e}")
                raise
        return cls._connection
    
    @classmethod
    async def _get_channel(cls):
        """Obtém ou cria um channel"""
        if cls._channel is None or cls._channel.is_closed:
            connection = await cls._get_connection()
            cls._channel = await connection.channel()
            
            # Declara a exchange 
            await cls._channel.declare_exchange(
                name=cls.EXCHANGE_NAME,
                type=aio_pika.ExchangeType.TOPIC, 
                durable=True
            )
        return cls._channel
    
    @classmethod
    async def publish_user_registered(cls, email: str, name: str) -> bool:
        """
        Publica evento de NOVO USUÁRIO (Boas-vindas)
        """
        try:
            message = {
                "event": "UserCreated", 
                "data": {
                    "user_id": user_id,
                    "email": email,
                    "name": name,
                    "created_at": str(datetime.utcnow())
                }
            }
            
            channel = await cls._get_channel()
            exchange = await channel.get_exchange(settings.RABBITMQ_EXCHANGE)
            
            await exchange.publish(
                aio_pika.Message(
                    body=json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type='application/json'
                ),
                routing_key=cls.ROUTING_KEY_USER_CREATED
            )
            
            logger.info(f"📤 Evento de Registro enviado para {email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao publicar user_registered: {e}")
            return False

    @classmethod
    async def close(cls):
        if cls._connection and not cls._connection.is_closed:
            await cls._connection.close()