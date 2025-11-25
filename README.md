# Soccer-Quiz

Uma plataforma de quizzes sobre futebol formada por um aplicativo móvel (React Native + Expo) que consome um backend declarado como uma arquitetura completa de microsserviços. A separação clara entre API Gateway, autenticação, usuários e domínio do quiz permite escalabilidade independente e governança de segurança centralizada.

## Escopo e arquitetura de microsserviços

### Serviços principais

- **API Gateway** (`backend/api-gateway`): única entrada externa. Centraliza roteamento, casbin para autorização e delegação de chamadas para os demais microsserviços.
- **Auth Service** (`backend/auth-service`): autenticação, geração de JWT/refresh tokens, controle de sessões e políticas de acesso baseadas em usuários e papéis.
- **User Service** (`backend/user-service`): gerencia cadastro, perfis, atualização e exclusão de usuários usando PostgreSQL.
- **Quiz Service** (`backend/quiz-service`): mantém times, perguntas e respostas no MongoDB e entrega o conteúdo do jogo.

Essa arquitetura permite que cada serviço escale independentemente, seja implantado isoladamente e conte com pipelines de CI/CD específicos (veja `.github/workflows`).

## Tecnologias utilizadas

- **Backend**: Python + FastAPI, Uvicorn/Gunicorn, Casbin (API Gateway), SQLAlchemy/Alembic (User + Auth), Motor/PyMongo (Quiz), python-jose para JWT, Passlib/Bcrypt para hashing.
- **Bancos**: PostgreSQL para dados relacionais e MongoDB para o domínio de quiz, orquestrados por Docker Compose.
- **Frontend**: React Native + Expo Router (TypeScript), bibliotecas de navegação (`@react-navigation/*`), `axios` para chamadas HTTP e recursos de UI nativos (`expo-image`, `expo-haptics`, etc.).
- **Ferramentas auxiliares**: Docker, Docker Compose, Makefile (comandos `make build`, `make up`, `make logs`, `make down`), Expo CLI.

## Requisitos de ambiente

1. **Docker** (Engine + Compose) para subir todos os microsserviços e bancos juntos.
2. **Make** (opcional) para comandos simplificados.
3. **Python 3.11+** (para executar serviços individualmente).
4. **Node.js 18+** + **npm** (ou Yarn) para o app Expo.
5. **Expo CLI** (globalmente) para executar o app móvel localmente.

## Funcionamento do projeto

1. O **app móvel** (`my-app`) faz requisições HTTP ao **API Gateway** (`localhost:3000`).
2. O gateway verifica autenticação/autorização e repassa a chamada para:
   - `/api/auth/*` → `auth-service:3000`
   - `/api/users/*` → `user-service:3000`
   - `/api/teams`, `/api/questions`, `/api/answers` → `quiz-service:3000`
3. O `auth-service` emite tokens JWT/refresh validados pelo gateway (casbin) e possuem controle de sessão e senha.
4. `user-service` utiliza PostgreSQL para persistência relacional.
5. `quiz-service` utiliza MongoDB para conteúdo flexível do quiz.
6. Swagger está exposto em cada serviço (`/docs`) para inspeção.

## Rodando o backend

1. Entre na pasta principal do backend:

   ```bash
   cd backend
   cp .env.example .env
   # edite .env com chaves (JWT_SECRET, strings de conexão, etc.)
   ```

2. Usando **Docker Compose** (modo recomendado):

   ```bash
   docker-compose build
   docker-compose up -d
   docker-compose logs -f
   docker-compose down
   ```

3. Para desenvolver cada serviço separadamente (sem Docker), execute o fluxo abaixo dentro de `backend/<serviço>`:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

   Repita para `api-gateway`, `auth-service`, `user-service` e `quiz-service`.

4. Verifique portas:

   ```bash
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   lsof -i :3003
   docker-compose ps
   docker-compose logs [service]
   ```

## Rodando o app Expo (`my-app`)

1. Instale dependências:

   ```bash
   cd my-app
   npm install
   ```

2. Inicie o servidor Metro e abra o app no simulador/dispositivo:

   ```bash
   npx run start     # inicia o Expo
   ```

3. Se necessário, use `npm run reset-project` para limpar caches específicos do projeto Expo.

## Documentação adicional

- Swagger (cada serviço): `http://localhost:<porta>/docs`.
- `backend/README.md` traz detalhes da arquitetura, fluxo e boas práticas de produção.
- `backend/.github/workflows` contém pipelines para `api-gateway`, `auth-service`, `quiz-service` e `user-service`.

Com essa base, basta garantir que o backend esteja ativo antes de iniciar o app móvel para que todas as rotas do quiz funcionem corretamente.
