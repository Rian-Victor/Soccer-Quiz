# quiz-service/app/worker.py

import asyncio
import json
import logging
import aio_pika
from app.config import settings
from app.database import init_db, get_database
from app.repositories.leaderboard_repository import LeaderboardRepository
from app.repositories.quiz_session_repository import QuizSessionRepository
from app.services.leaderboard_service import LeaderboardService
from app.schemas.quiz_session import QuizSession

# Configuração de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_message(
    message: aio_pika.IncomingMessage, 
    service: LeaderboardService
):
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            logger.info(f"📥 Recebido evento game.finished: {data['session_id']}")
            
            # Aqui precisamos reconstruir o objeto Session ou buscar do banco
            # Como o payload tem tudo, podemos usar os dados direto ou buscar
            # Vamos buscar do banco para garantir consistência
            session = await service.session_repo.get_by_id(data['session_id'])
            
            if session:
                # O nome do usuário poderia vir do User Service via HTTP, 
                # mas para simplificar vamos assumir que veio no payload ou usar placeholder
                user_name = data.get("user_name", f"User {session.user_id}")
                
                await service.update_after_quiz(session, user_name)
            else:
                logger.warning(f"Sessão {data['session_id']} não encontrada no banco")

        except Exception as e:
            logger.error(f"❌ Erro ao processar mensagem: {e}")

async def main():
    # 1. Inicializar Banco de Dados
    await init_db()
    db = get_database()
    
    # 2. Instanciar Serviço
    leaderboard_repo = LeaderboardRepository(db)
    session_repo = QuizSessionRepository(db)
    service = LeaderboardService(leaderboard_repo, session_repo)
    
    # 3. Conectar RabbitMQ
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    channel = await connection.channel()
    
    # Definir Exchange e Fila
    exchange = await channel.declare_exchange("quiz_events", aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue("leaderboard_updater", durable=True)
    
    # Ligar Fila na Exchange (Binding)
    await queue.bind(exchange, routing_key="game.finished")
    
    logger.info("🚀 Worker de Leaderboard iniciado e aguardando mensagens...")
    
    # 4. Loop de Consumo
    await queue.consume(lambda msg: process_message(msg, service))
    
    # Manter rodando para sempre
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())