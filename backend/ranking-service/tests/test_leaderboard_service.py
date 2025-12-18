import pytest
import asyncio
from datetime import datetime

from app.services.leaderboard_service import LeaderboardService
from app.schemas.leaderboard import LeaderboardEntry


class MockRepo:
    def __init__(self):
        self.storage = {}

    async def get_or_create(self, user_id: int, user_name: str) -> LeaderboardEntry:
        if user_id in self.storage:
            return self.storage[user_id]
        entry = LeaderboardEntry(
            user_id=user_id,
            user_name=user_name,
            last_quiz_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.storage[user_id] = entry
        return entry

    async def update(self, entry: LeaderboardEntry) -> LeaderboardEntry:
        self.storage[entry.user_id] = entry
        return entry

    async def get_top(self, limit: int = 100):
        return list(self.storage.values())[:limit]

    async def get_fastest_players(self, limit: int = 10):
        return list(self.storage.values())[:limit]

    async def get_by_user_id(self, user_id: int):
        return self.storage.get(user_id)


@pytest.mark.asyncio
async def test_update_after_quiz_creates_and_updates():
    repo = MockRepo()
    service = LeaderboardService(repo)

    await service.update_after_quiz(
        user_id=1,
        user_name="Test User",
        total_points=500,
        total_time_seconds=300,
        correct_answers=10,
        total_questions=10,
        finished_at=datetime.utcnow()
    )

    entry = await repo.get_by_user_id(1)
    assert entry is not None
    assert entry.total_points == 500
    assert entry.total_quizzes_completed == 1

@pytest.mark.asyncio
async def test_get_user_ranking_returns_none_if_missing():
    repo = MockRepo()
    service = LeaderboardService(repo)

    result = await service.get_user_ranking(999)
    assert result is None
