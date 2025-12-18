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
        self.exchange = settings.RABBITMQ_EXCHANGE   
        self.routing_key = "auth.password_reset"

    def publish_password_reset(self, email: str, token: str, user_name: str = None): 
        connection = None
        try:
            params = pika.URLParameters(self.url)
            params.connection_attempts = 3
            params.retry_delay = 2
            params.socket_timeout = 5.0  
            
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            channel.exchange_declare(
                exchange=self.exchange, 
                exchange_type='topic', 
                durable=True
            )
            
            logger.info(f"🔍 DEBUG Producer: email={email}, token={token}, user_name={user_name}")
            
            message = {
                "type": "PASSWORD_RESET",
                "email": email,
                "token": token,
                "user_name": user_name  
            }
            
            channel.basic_publish(
                exchange=self.exchange,
                routing_key=self.routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            
            logger.info(f"📤 Evento PASSWORD_RESET enviado para {email}")

        except pika.exceptions.AMQPConnectionError as e:
            logger.error(f"❌ Erro de conexão RabbitMQ: {e}")
        except Exception as e:
            logger.error(f"❌ Erro ao publicar no RabbitMQ: {e}")
        finally:
            if connection and not connection.is_closed:
                connection.close()

    def publish_user_registered(self, email: str, name: str):
        """Publica evento de novo usuário registrado"""
        connection = None
        try:
            params = pika.URLParameters(self.url)
            params.connection_attempts = 3
            params.retry_delay = 2
            params.socket_timeout = 5.0


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
                routing_key=self.routing_key, #evento: user_registered
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            logger.info(f"📤 [RabbitMQ] Boas-vindas enviadas para {email}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao publicar user_registered: {e}")
        finally:
            if connection and not connection.is_closed:
                connection.close()