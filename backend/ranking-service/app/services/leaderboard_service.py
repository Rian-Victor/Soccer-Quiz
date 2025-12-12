"""
Service para Leaderboard
Atualiza rankings após receber eventos do Quiz Service
"""
from typing import List, Optional
from datetime import datetime
import logging

from app.repositories.leaderboard_repository import LeaderboardRepository
from app.schemas.leaderboard import LeaderboardEntry

logger = logging.getLogger(__name__)


class LeaderboardService:
    def __init__(self, leaderboard_repo: LeaderboardRepository):
        self.leaderboard_repo = leaderboard_repo
    
    async def update_after_quiz(
        self, 
        user_id: int,
        user_name: str,
        total_points: int,
        total_time_seconds: int,
        correct_answers: int,
        total_questions: int,
        finished_at: datetime
    ):
        """Atualiza ranking após conclusão de quiz"""
        
        # Buscar ou criar entrada do usuário
        entry = await self.leaderboard_repo.get_or_create(user_id, user_name)
        
        # Atualizar estatísticas acumuladas
        entry.total_quizzes_completed += 1
        entry.total_points += total_points
        
        if entry.total_quizzes_completed > 0:
            entry.average_points = entry.total_points / entry.total_quizzes_completed
        
        # --- Lógica de Melhor Pontuação (Com Desempate por Tempo) ---
        is_new_record = False
       
        if total_points > entry.best_quiz_points:
            is_new_record = True
  
        elif total_points == entry.best_quiz_points:
            if entry.best_quiz_time_seconds is None or total_time_seconds < entry.best_quiz_time_seconds:
                is_new_record = True
        
        if is_new_record:
            entry.best_quiz_points = total_points
            entry.best_quiz_time_seconds = total_time_seconds

        # --- Lógica de Jogador Mais Rápido (Apenas Perfect Scores) ---
        if correct_answers == total_questions and total_questions > 0:
            current_fastest = entry.fastest_completion_time
            
            if current_fastest is None or total_time_seconds < current_fastest:
                entry.fastest_completion_time = total_time_seconds

        entry.last_quiz_at = finished_at
        entry.updated_at = datetime.utcnow()
        
        await self.leaderboard_repo.update(entry)
        logger.info(f"✅ Ranking atualizado: user_id={user_id}, pts={total_points}")
    
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
    
    async def get_user_ranking(self, user_id: int) -> Optional[dict]:
        """Retorna dados de ranking de um usuário específico"""
        entry = await self.leaderboard_repo.get_by_user_id(user_id)
        if not entry:
            return None
        
        return {
            "user_id": entry.user_id,
            "user_name": entry.user_name,
            "total_points": entry.total_points,
            "total_quizzes": entry.total_quizzes_completed,
            "average_points": round(entry.average_points, 2),
            "best_quiz_points": entry.best_quiz_points,
            "fastest_completion_time": entry.fastest_completion_time,
            "fastest_time_formatted": self._format_time(entry.fastest_completion_time),
            "last_quiz_at": entry.last_quiz_at.isoformat() if entry.last_quiz_at else None,
            "updated_at": entry.updated_at.isoformat() if entry.updated_at else None
        }
    
    def _format_time(self, seconds: Optional[int]) -> str:
        """Formata tempo em MM:SS"""
        if seconds is None:
            return "--:--"
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes:02d}:{secs:02d}"
