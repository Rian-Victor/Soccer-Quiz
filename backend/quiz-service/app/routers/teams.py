"""
Rotas de Teams
CRUD de times
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.repositories.team_repository import TeamRepository
from app.interfaces.repositories import ITeamRepository
from app.dependencies import require_admin_role


router = APIRouter()


# Schemas Pydantic
class TeamCreate(BaseModel):
    """Schema para criação de time"""
    name: str
    country: str
    members: List[int] = []  # IDs dos usuários membros


class TeamUpdate(BaseModel):
    """Schema para atualização de time"""
    name: Optional[str] = None
    country: Optional[str] = None
    members: Optional[List[int]] = None


class TeamResponse(BaseModel):
    """Schema de resposta de time"""
    id: str
    name: str
    country: str
    members: List[int]
    
    class Config:
        from_attributes = True


# Dependência para obter repositório
def get_team_repository() -> ITeamRepository:
    """Dependência para obter repositório de times"""
    return TeamRepository()


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    repository: ITeamRepository = Depends(get_team_repository),
    _admin_role: str = Depends(require_admin_role)
):
    """Cria um novo time (apenas admin)"""
    team_dict = team_data.model_dump()
    team = await repository.create(team_dict)
    return TeamResponse(**team)


@router.get("", response_model=List[TeamResponse])
async def get_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    repository: ITeamRepository = Depends(get_team_repository)
):
    """Lista todos os times (apenas admin)"""
    teams = await repository.get_all(skip=skip, limit=limit)
    return [TeamResponse(**team) for team in teams]


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    repository: ITeamRepository = Depends(get_team_repository)
):
    """Busca um time por ID (apenas admin)"""
    team = await repository.get_by_id(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time com ID {team_id} não encontrado"
        )
    return TeamResponse(**team)


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_data: TeamUpdate,
    repository: ITeamRepository = Depends(get_team_repository),
    _admin_role: str = Depends(require_admin_role)
):
    """Atualiza um time (apenas admin)"""
    update_dict = team_data.model_dump(exclude_none=True)
    team = await repository.update(team_id, update_dict)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time com ID {team_id} não encontrado"
        )
    return TeamResponse(**team)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str,
    repository: ITeamRepository = Depends(get_team_repository),
    _admin_role: str = Depends(require_admin_role)
):
    """Deleta um time (apenas admin)"""
    success = await repository.delete(team_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time com ID {team_id} não encontrado"
        )

