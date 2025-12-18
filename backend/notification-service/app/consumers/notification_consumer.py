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
        self.exchange_name = settings.RABBITMQ_EXCHANGE
        self.connection = None
        self.channel = None

    async def start(self):
        logger.info("🚀 Iniciando Consumidor de Notificações...")
        while True:
            try:
                await self._connect_and_consume()
            except asyncio.CancelledError:
                logger.info("🛑 Shutdown detectado. Parando consumidor graciosamente...")
                break
            except Exception as e:
                logger.error(f"❌ Erro RabbitMQ: {e}. Retentando em 5s...")
                try:
                    await asyncio.sleep(5)
                except asyncio.CancelledError:
                    logger.info("🛑 Shutdown durante a espera. Parando...")
                    break

    async def _connect_and_consume(self):
        logger.info(f"🔌 Conectando ao RabbitMQ...")
        self.connection = await aio_pika.connect_robust(self.rabbitmq_url)
        
        async with self.connection:
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)

            # Declarações
            exchange = await self.channel.declare_exchange(
                self.exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
            )

            # --- SETUP DA FILA 1: BOAS-VINDAS ---
            queue_welcome = await self.channel.declare_queue(
                "notification_welcome_queue", # Nome fixo para persistência
                durable=True
            )
            await queue_welcome.bind(exchange, routing_key="user.created")
            await queue_welcome.consume(self._on_welcome_message)
            logger.info(f"✅ Fila [Boas-Vindas] vinculada a 'user.created'{self.exchange_name}")

            # --- SETUP DA FILA 2: PASSWORD RESET ---
            queue_reset = await self.channel.declare_queue(
                "notification_reset_queue", 
                durable=True
            )

            await queue_reset.bind(exchange, routing_key="auth.password_reset")
            await queue_reset.consume(self._on_reset_message)
            logger.info(f"✅ Fila [Reset Senha] vinculada a 'auth.password_reset'{self.exchange_name}")
   
            # --- SETUP DA FILA 3: QUIZ CREATED ---

            queue_quiz = await self.channel.declare_queue(
                "notification_new_quiz_queue", 
                durable=True
            )

            await queue_quiz.bind(exchange, routing_key="quiz.created")
            await queue_quiz.consume(self._on_quiz_created_message)

            logger.info(f"✅ Fila [Novo Quiz] vinculada a 'quiz_events'{self.exchange_name}")

            # --- SETUP DA FILA 4: CONVITE DE AMIGO ----

            queue_invite = await self.channel.declare_queue(
                "notification_invite_queue", 
                durable=True
            )
            # Ouve a chave 'user.invite' na exchange 'notifications'
            await queue_invite.bind(exchange, routing_key="user.invite")
            await queue_invite.consume(self._on_invite_message)
            
            logger.info(f"✅ Fila [Convite] vinculada a '{self.exchange_name}'")

            logger.info("🚀 Consumidor rodando e aguardando eventos...")
            await asyncio.Future()

           

    # --- PROCESSADOR 1: BOAS VINDAS ---
    async def _on_welcome_message(self, message: aio_pika.IncomingMessage):
        """Processa apenas mensagens da fila de boas-vindas"""
        async with message.process(): 
            try:
                body = message.body.decode()
                data = json.loads(body)
                
                user_data = data.get('data', data) 
                
                email = user_data.get('email')
                name = user_data.get('name')
                
                logger.info(f"📨 [Boas-Vindas] Recebido para: {email}")
                
                if email and name:
                    await EmailService.send_welcome_email(email, name)
                    logger.info(f"✅ [Boas-Vindas] Email enviado para {email}")
                else:
                    logger.error(f"⚠️ [Boas-Vindas] Dados incompletos: {data}")

            except Exception as e:
                logger.error(f"❌ [Boas-Vindas] Erro de processamento: {e}")
                

    # --- PROCESSADOR 2: RESET SENHA ---
    async def _on_reset_message(self, message: aio_pika.IncomingMessage):
        """Processa apenas mensagens da fila de reset"""
        async with message.process():
            try:
                body = message.body.decode()
                data = json.loads(body)
                
                logger.info(f"🔑 [Reset] Recebido para: {data.get('email')}")
                
                await self._handle_password_reset_logic(data)

            except Exception as e:
                logger.error(f"❌ [Reset] Erro de processamento: {e}")


    # --- PROCESSADOR 3: NOVO QUIZ CRIADO ---
    async def _on_quiz_created_message(self, message: aio_pika.IncomingMessage):
        """Notifica usuários sobre novo quiz"""
        async with message.process():
            try:
                body = message.body.decode()
                data = json.loads(body)
                
                title = data.get('title', 'Novo Desafio')
                difficulty = data.get('difficulty', 'Geral')
                
                logger.info(f"📢 [Novo Quiz] Evento recebido: {title}")

                logger.info("="*40)
                logger.info(f"📧 DISPARANDO EMAIL EM MASSA PARA USUÁRIOS!")
                logger.info(f"Assunto: O Quiz '{title}' já está disponível!")
                logger.info(f"Nível: {difficulty}")
                logger.info("="*40)

                await EmailService.send_quiz_notification_batch(title, difficulty)

            except Exception as e:
                logger.error(f"❌ [Novo Quiz] Erro de processamento: {e}")


    # --- PROCESSADOR 4: CONVITE DE AMIGO ---
    async def _on_invite_message(self, message: aio_pika.IncomingMessage):
        """Processa convites de amigos"""
        async with message.process():
            try:
                body = message.body.decode()
                data = json.loads(body)
                
                inviter = data.get('inviter_name', 'Um amigo')
                email = data.get('target_email')
                
                logger.info(f"💌 [Convite] De {inviter} para {email}")
                
                if email:
                    await EmailService.send_invite_email(email, inviter)
                    
            except Exception as e:
                logger.error(f"❌ [Convite] Erro: {e}")

    # --- LÓGICA DE NEGÓCIO AUXILIAR ---
    async def _handle_password_reset_logic(self, data: Dict[str, Any]):
        email = data.get('email')
        token = data.get('token')
        name = data.get('user_name') or data.get('name')
        
        # LINK DE RESET (FRONTEND)
        base_url = settings.FRONTEND_BASE_URL or "http://localhost:3000"
        path = getattr(settings, 'RESET_PASSWORD_PATH', '/reset-password')
        final_link = f"{base_url}{path}?token={token}"

        if not email or not token:
            logger.error(f"❌ [Reset] Dados inválidos: {data}")
            return

        success = await EmailService.send_password_reset_email(
            to_email=email,
            reset_link=final_link,
            user_name=name
        )
        
        if success:
            logger.info(f"✅ [Reset] Email disparado com sucesso.")
        else:
            logger.error(f"⚠️ [Reset] Falha no envio SMTP.")