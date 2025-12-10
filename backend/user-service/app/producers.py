import pika
import json
import logging
from app.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

class RabbitMQProducer:
    """Classe responsável por publicar mensagens no RabbitMQ"""

    def __init__(self):
        self.url = settings.RABBITMQ_URL
        self.exchange = settings.RABBITMQ_EXCHANGE    # "notifications"
        self.routing_key = "user.created"  

    def publish_user_registered(self, email: str, name: str):
        """Publica evento de novo usuário registrado"""
        connection = None
        try:
            # 1. Conecta 
            params = pika.URLParameters(self.url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            # 2. Declara a Exchange 
            channel.exchange_declare(
                exchange=self.exchange, 
                exchange_type='topic', 
                durable=True
            )

            # 3. Monta a mensagem (Payload)
            message = {
                "type": "USER_CREATED",
                "email": email,
                "name": name,
                "created_at": str(datetime.utcnow())
            }
            
            # 4. Publica
            channel.basic_publish(
                exchange=self.exchange,
                routing_key=self.routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  
                    content_type='application/json'
                )
            )
            
            logger.info(f"📤 Evento USER_CREATED enviado para {email}")

        except Exception as e:
            logger.error(f"❌ Erro ao publicar no RabbitMQ: {e}")
            
        finally:
            if connection:
                connection.close()
    
