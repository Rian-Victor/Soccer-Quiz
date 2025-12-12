import json
import logging
import asyncio
import aio_pika
from datetime import datetime, timezone

from app.config import settings
from app.database import get_database
from app.repositories.leaderboard_repository import LeaderboardRepository
from app.services.leaderboard_service import LeaderboardService

logger = logging.getLogger("uvicorn.error")

class RabbitMQConsumer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = None
        self.queue = None

    async def connect(self):
        """Conecta ao RabbitMQ com Retry e Logs Visíveis"""
        logger.info("🔌 [RabbitMQ] Iniciando tentativa de conexão...")
        
        retry_count = 0
        max_retries = 10 
        
        while retry_count < max_retries:
            try:
                logger.info(f"⏳ [RabbitMQ] Tentativa {retry_count + 1}/{max_retries} conectando em {settings.RABBITMQ_URL}...")
                
                self.connection = await aio_pika.connect_robust(
                    settings.RABBITMQ_URL, 
                    loop=asyncio.get_running_loop()
                )
                
                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=1)
                
                logger.info("🛠️ [RabbitMQ] Declarando Exchange e Fila...")
                
                self.exchange = await self.channel.declare_exchange(
                    "quiz_events",
                    aio_pika.ExchangeType.TOPIC,
                    durable=True
                )
                
                self.queue = await self.channel.declare_queue(
                    "ranking_updates",
                    durable=True
                )
                
                await self.queue.bind(self.exchange, routing_key="game.finished")
                await self.queue.consume(self._on_message)
                
                logger.info("✅ [RabbitMQ] CONECTADO COM SUCESSO! Ouvindo 'game.finished'.")
                return 

            except Exception as e:
                retry_count += 1
                logger.warning(f"⚠️ [RabbitMQ] Falha: {str(e)}")
                logger.warning("💤 [RabbitMQ] Aguardando 5 segundos...")
                await asyncio.sleep(5)

        logger.error("❌ [RabbitMQ] Esgotou tentativas. O serviço vai parar.")
        raise ConnectionRefusedError("Não foi possível conectar ao RabbitMQ")

    async def _on_message(self, message: aio_pika.IncomingMessage):
        """Processa mensagem recebida"""
        try:
            async with message.process():
                payload = json.loads(message.body.decode())
                logger.info(f"📥 [EVENTO] Recebido: {message.routing_key}")
                await self._handle_game_finished(payload)
        except Exception as e:
            logger.error(f"❌ Erro ao processar mensagem: {e}")

    async def _handle_game_finished(self, payload: dict):
        try:
            db = get_database()
            leaderboard_repo = LeaderboardRepository(db)
            service = LeaderboardService(leaderboard_repo)
   
            finished_at_str = payload.get("finished_at")
            if finished_at_str:
                finished_at = datetime.fromisoformat(finished_at_str)
            else:
                finished_at = datetime.now(timezone.utc)

            await service.update_after_quiz(
                user_id=payload.get("user_id"),
                user_name=payload.get("user_name"),
                total_points=payload.get("total_points", 0),
                total_time_seconds=payload.get("total_time_seconds", 0),
                correct_answers=payload.get("correct_answers", 0),
                total_questions=payload.get("total_questions", 1),
                finished_at=finished_at
            )
            logger.info(f"🏆 [RANKING] Atualizado para User ID: {payload.get('user_id')}")
            
        except Exception as e:
            logger.error(f"❌ Erro na lógica de ranking: {e}")

    async def close(self):
        if self.connection:
            await self.connection.close()
            logger.info("🔌 [RabbitMQ] Desconectado.")