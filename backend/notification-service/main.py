"""
Notification Service - Soccer Quiz
Responsável por consumir eventos de notificação e enviar emails
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import logging

from app.config import settings
from app.consumers.notification_consumer import NotificationConsumer

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Variável global para manter o consumer
consumer_instance = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global consumer_instance
    
    # Startup
    logger.info(f"🚀 Notification Service iniciado na porta {settings.PORT}")
    logger.info(f"📧 SMTP configurado: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    logger.info(f"🔄 RabbitMQ: {settings.RABBITMQ_URL}")
    
    # Iniciar consumer de mensagens
    consumer_instance = NotificationConsumer()
    asyncio.create_task(consumer_instance.start())
    
    yield
    
    # Shutdown
    logger.info("🛑 Encerrando Notification Service...")
    if consumer_instance:
        await consumer_instance.close()
    logger.info("✅ Notification Service encerrado")

app = FastAPI(
    title="Soccer Quiz Notification Service",
    description="Serviço de notificações - Consumidor de fila RabbitMQ para envio de emails",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["health"])
async def root():
    """Health check endpoint"""
    return {
        "service": "notification-service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )