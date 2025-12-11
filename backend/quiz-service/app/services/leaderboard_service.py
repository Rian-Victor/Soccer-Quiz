# quiz-service/app/services/leaderboard_service.py

from typing import List, Optional
from datetime import datetime
import logging

from app.repositories.leaderboard_repository import LeaderboardRepository
from app.repositories.quiz_session_repository import QuizSessionRepository
# Importando os Schemas/Enums corretos
from app.schemas.leaderboard import LeaderboardEntry
from app.schemas.quiz_session import QuizSession, QuizStatus

logger = logging.getLogger(__name__)

class LeaderboardService:
    def __init__(
        self,
        leaderboard_repo: LeaderboardRepository,
        session_repo: QuizSessionRepository
    ):
        self.leaderboard_repo = leaderboard_repo
        self.session_repo = session_repo
    
    async def update_after_quiz(
        self, 
        session: QuizSession, 
        user_name: str
    ):
        """Atualiza ranking após conclusão de quiz"""
        # 1. Uso de Enum ao invés de string mágica
        if session.status != QuizStatus.COMPLETED:
            logger.warning(f"Tentativa de atualizar ranking com quiz não finalizado: {session.id}")
            return
        
        # Buscar ou criar entrada do usuário
        entry = await self.leaderboard_repo.get_or_create(
            user_id=session.user_id,
            user_name=user_name
        )
        
        # Atualizar estatísticas acumuladas
        entry.total_quizzes_completed += 1
        entry.total_points += session.total_points
        
        # Evita divisão por zero (embora improvável aqui)
        if entry.total_quizzes_completed > 0:
            entry.average_points = entry.total_points / entry.total_quizzes_completed
        
        # --- Lógica de Melhor Pontuação (Com Desempate por Tempo) ---
        is_new_record = False
        
        # Caso 1: Pontuação maior que a anterior
        if session.total_points > entry.best_quiz_points:
            is_new_record = True
        # Caso 2: Pontuação igual, mas tempo menor (mais rápido)
        elif session.total_points == entry.best_quiz_points:
            # Se não tinha tempo registrado antes OU o novo tempo é menor
            if entry.best_quiz_time_seconds is None or session.total_time_seconds < entry.best_quiz_time_seconds:
                is_new_record = True
        
        if is_new_record:
            entry.best_quiz_points = session.total_points
            entry.best_quiz_time_seconds = session.total_time_seconds

        # --- Lógica de Jogador Mais Rápido (Apenas Perfect Scores) ---
        # Só conta para o ranking de velocidade se acertou TUDO
        total_questions = len(session.questions)
        if session.correct_answers == total_questions and total_questions > 0:
            current_fastest = entry.fastest_completion_time
            
            if current_fastest is None or session.total_time_seconds < current_fastest:
                entry.fastest_completion_time = session.total_time_seconds

        entry.last_quiz_at = session.finished_at
        entry.updated_at = datetime.utcnow()
        
        await self.leaderboard_repo.update(entry)
        logger.info(f"✅ Ranking atualizado: user_id={session.user_id}, pts={session.total_points}")
    
    async def get_general_ranking(self, limit: int = 100) -> List[dict]:
        """Ranking geral por pontuação"""
        entries = await self.leaderboard_repo.get_top(limit)
        
        return [
            {
                "rank": idx + 1,
                "user_id": entry.user_id,
                "user_name": entry.user_name,
                "total_points": entry.total_points,
                "total_quizzes": entry.total_quizzes_completed,
                "average_points": round(entry.average_points, 2),
                "best_quiz_points": entry.best_quiz_points
            }
            for idx, entry in enumerate(entries)
        ]
    
    async def get_fastest_players(self, limit: int = 10) -> List[dict]:
        """Ranking de jogadores mais rápidos"""
        entries = await self.leaderboard_repo.get_fastest_players(limit)
        
        return [
            {
                "rank": idx + 1,
                "user_id": entry.user_id,
                "user_name": entry.user_name,
                "fastest_time_seconds": entry.fastest_completion_time,
                "fastest_time_formatted": self._format_time(entry.fastest_completion_time)
            }
            for idx, entry in enumerate(entries)
        ]
    
    def _format_time(self, seconds: Optional[int]) -> str:
        """Formata tempo em MM:SS"""
        if seconds is None:
            return "--:--"
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes:02d}:{secs:02d}"