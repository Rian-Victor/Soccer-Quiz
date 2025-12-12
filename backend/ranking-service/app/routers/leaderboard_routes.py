"""
Rotas de Leaderboard (Ranking)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import get_database
from app.repositories.leaderboard_repository import LeaderboardRepository
from app.services.leaderboard_service import LeaderboardService

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


def get_leaderboard_service(db = Depends(get_database)) -> LeaderboardService:
    """
    Fábrica que cria o serviço de ranking com todas as dependências necessárias
    """
    leaderboard_repo = LeaderboardRepository(db)
    return LeaderboardService(leaderboard_repo)


@router.get("/general")
async def get_general_ranking(
    limit: int = 100,
    service: LeaderboardService = Depends(get_leaderboard_service)
):
    """
    Retorna o ranking geral ordenado por pontos.
    REQ 08 - Visualizar Ranking
    """
    ranking = await service.get_general_ranking(limit)
    return {"ranking": ranking}


@router.get("/fastest")
async def get_fastest_players(
    limit: int = 10,
    service: LeaderboardService = Depends(get_leaderboard_service)
):
    """
    Retorna os jogadores mais rápidos (que acertaram 100%).
    REQ 13 - Identificar Jogador mais rápido
    """
    fastest = await service.get_fastest_players(limit)
    return {"fastest_players": fastest}


@router.get("/user/{user_id}")
async def get_user_ranking(
    user_id: int,
    service: LeaderboardService = Depends(get_leaderboard_service)
):
    """
    Retorna dados de ranking de um usuário específico
    """
    ranking = await service.get_user_ranking(user_id)
    if not ranking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado no ranking"
        )
    return ranking
