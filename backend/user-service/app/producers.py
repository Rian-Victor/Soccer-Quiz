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
        self.routing_key = settings.RABBITMQ_ROUTING_KEY # "email.password_reset"

    def publish_password_reset(self, email: str, token: str):
        connection = None
        try:
            # 1. Conecta 
            params = pika.URLParameters(self.url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            # 2. Declara a Exchange 
            channel.exchange_declare(
                exchange=self.exchange, 
                exchange_type='direct', 
                durable=True
            )

            # 3. Monta a mensagem (Payload)
            message = {
                "type": "PASSWORD_RESET",
                "email": email,
                "token": token
            }
            
            # 4. Publica
            channel.basic_publish(
                exchange=self.exchange,
                routing_key=self.routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Persistente (não perde se o Rabbit cair)
                    content_type='application/json'
                )
            )
            

        except Exception as e:
            logger.error(f"❌ Erro ao publicar no RabbitMQ: {e}")
            # Em produção, você poderia salvar numa tabela 'outbox' para tentar depois
        finally:
            if connection:
                connection.close()
    
    # ... método publish_password_reset acima ...

    def publish_user_registered(self, email: str, name: str):
        """Publica evento de novo usuário registrado"""
        connection = None
        try:
            params = pika.URLParameters(self.url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()

            channel.exchange_declare(
                exchange=self.exchange, 
                exchange_type='direct', 
                durable=True
            )

            message = {
                "type": "USER_REGISTERED",  
                "email": email,
                "name": name,
                "created_at": str(datetime.utcnow())
            }
            
            channel.basic_publish(
                exchange=self.exchange,
                routing_key="user.registered",
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            
        except Exception as e:
            logger.error(f"❌ Erro ao publicar user_registered: {e}")
        finally:
            if connection:
                connection.close()