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
            
            # Declarar exchange e fila (idempotente)
            exchange = await cls._channel.declare_exchange(
                name=settings.RABBITMQ_EXCHANGE,
                type=aio_pika.ExchangeType.DIRECT,
                durable=True
            )
            
            queue = await cls._channel.declare_queue(
                name=settings.RABBITMQ_QUEUE,
                durable=True
            )
            
            await queue.bind(
                exchange=exchange,
                routing_key=settings.RABBITMQ_ROUTING_KEY
            )
        
        return cls._channel
    
    @classmethod
    async def publish_password_reset_event(
        cls,
        email: str,
        reset_link: str,
        user_name: str = None
    ) -> bool:
        """
        Publica um evento de reset de senha
        
        Args:
            email: Email do usuário
            reset_link: Link para reset da senha
            user_name: Nome do usuário (opcional)
            
        Returns:
            True se sucesso, False se falha
        """
        try:
            message = {
                "type": "password_reset",
                "email": email,
                "reset_link": reset_link,
                "user_name": user_name
            }
            
            channel = await cls._get_channel()
            exchange = await channel.get_exchange(settings.RABBITMQ_EXCHANGE)
            
            await exchange.publish(
                aio_pika.Message(
                    body=json.dumps(message).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key=settings.RABBITMQ_ROUTING_KEY
            )
            
            logger.info(f"📤 Evento de reset publicado para {email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao publicar evento: {e}")
            return False
    
    @classmethod
    async def close(cls):
        """Fecha a conexão"""
        if cls._connection and not cls._connection.is_closed:
            await cls._connection.close()
            logger.info("🔌 Conexão RabbitMQ fechada")