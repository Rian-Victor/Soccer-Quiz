### Soccer-Quiz — Copilot instructions for contributors

Short, actionable guidance so AI coding agents are immediately productive in this repo.

1. Big picture
- Monorepo of a small microservices backend (Python/FastAPI) + React Native front-end (`my-app`).
- Core services (all under `backend/`): `api-gateway`, `auth-service`, `user-service`, `quiz-service`.
- `api-gateway` is a proxy + authz layer (JWT auth + Casbin). It routes `/api/auth/*` → `auth-service`, `/api/users/*` → `user-service`, and quiz routes → `quiz-service`.

2. How services communicate
- Gateway proxies requests using `backend/api-gateway/app/services/proxy.py` (async `httpx`).
- Gateway enforces authentication in `backend/api-gateway/app/middleware/jwt_auth.py` and Casbin permissions in `backend/api-gateway/app/middleware/casbin_authz.py`.
- Tokens: JWTs are produced/validated in `backend/auth-service/app/services/jwt_service.py` and consumed by gateway middleware.

3. Data stores
- `quiz-service` uses MongoDB (`backend/quiz-service/app/database.py`).
- `auth-service` and `user-service` use SQL-based engines (see each service `app/database.py`); `user-service` code references SQL Server connection patterns.

4. How to run locally (developer quick-start)
- Recommended: Docker Compose at repo root. Useful commands (in PowerShell on Windows):
  - `docker-compose build`
  - `docker-compose up -d`
  - `docker-compose logs -f [service-name]`
  - `docker-compose down`
- Alternative: run individual service for dev
  - Create venv and install: `python -m venv venv; venv\Scripts\activate; pip install -r requirements.txt` (inside the service folder)
  - Run: `python main.py` or `uvicorn main:app --reload --host 0.0.0.0 --port <PORT>`

5. Important ports & URLs (dev)
- API Gateway: `http://localhost:3000` (docs at `/docs`)
- User Service: `http://localhost:3001`
- Auth Service: `http://localhost:3002`
- Quiz Service: `http://localhost:3003`

6. Environment / conventions
- Services read env vars from `.env` files; examples in each service are named `.env.example`.
- Common env var names used by the gateway: `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `QUIZ_SERVICE_URL`.

7. Project-specific patterns and places to edit code
- Add routes: each service exposes routers under `app/routers/` and is wired in the service `main.py` via `include_router`.
- Auth tokens: inspect `backend/auth-service/app/services/jwt_service.py` and gateway middleware `backend/api-gateway/app/middleware/jwt_auth.py` for payload shape (`sub`/`userId`, `role`).
- Authorization policies: `backend/api-gateway/app/casbin/policy.csv` and `rbac_model.conf` define role rules.
- Proxy logic: `backend/api-gateway/app/services/proxy.py` shows how headers and paths are forwarded to backend services — follow this to preserve auth headers.

8. Tests and linters
- Run service tests with `pytest` (install `pytest`, `pytest-asyncio`, `httpx` in the service venv). Example: in `api-gateway` folder run `pytest`.
- Formatting and static checks: `black .`, `flake8 .`, `mypy .` (installed per-project in venv).

9. When changing DB models or migrations
- SQL services create tables on startup via SQLAlchemy `Base.metadata.create_all(bind=engine)` (see `auth-service/main.py` lifespan). Be careful: this is not a replacement for proper migrations in production.

10. PR guidance for AI agents (what to do and what to avoid)
- Do: make minimal, focused changes; include tests for API changes; update `README.md` when run instructions change.
- Do: reference exact file paths in diffs and preserve existing coding style.
- Avoid: changing infra (Docker Compose or Makefile) without explicit instructions; avoid hardcoding secrets — use env vars.

11. Quick pointers to inspect
- Gateway middleware and routing: `backend/api-gateway/app/middleware/` and `backend/api-gateway/app/routers/gateway.py`.
- JWT helpers: `backend/auth-service/app/services/jwt_service.py`.
- Casbin policies: `backend/api-gateway/app/casbin/policy.csv`.
- Database patterns: `backend/*-service/app/database.py`.

If any part is unclear or you want more detailed examples (e.g., a small end-to-end change including tests), tell me which service and I will expand the instructions or propose a concrete PR patch.
