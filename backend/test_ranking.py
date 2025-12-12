import asyncio
import aio_pika
import json
from datetime import datetime

async def main():
    # URL de conexão (Localhost porque você está rodando do seu Windows)
    amqp_url = "amqp://guest:guest@localhost:5672/"
    
    print(f"🔌 Tentando conectar ao RabbitMQ em {amqp_url}...")
    
    try:
        connection = await aio_pika.connect_robust(amqp_url)
        channel = await connection.channel()

        # Garante que a Exchange existe (igual ao seu consumer)
        exchange = await channel.declare_exchange(
            "quiz_events", 
            aio_pika.ExchangeType.TOPIC, 
            durable=True
        )

        # Dados fake de um usuário que "acabou de jogar"
        payload = {
            "user_id": 999,
            "user_name": "Rebeca Tester",
            "total_points": 150,
            "total_time_seconds": 30,
            "correct_answers": 10,
            "total_questions": 10,
            "finished_at": datetime.now().isoformat()
        }

        # Publica a mensagem na rota que o Ranking Service escuta
        await exchange.publish(
            aio_pika.Message(body=json.dumps(payload).encode()),
            routing_key="game.finished"
        )

        print(f"✅ Mensagem enviada! Usuário: {payload['user_name']} - Pontos: {payload['total_points']}")
        print("👀 Olhe os logs do 'soccer-quiz-ranking-service' agora!")
        
        await connection.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        print("Dica: Verifique se o RabbitMQ está rodando e se a porta 5672 está aberta.")

if __name__ == "__main__":
    asyncio.run(main())