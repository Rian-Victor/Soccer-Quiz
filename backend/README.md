# Soccer Quiz - Backend

Backend do Soccer Quiz implementado como arquitetura de microsserviços usando Python/FastAPI.

## Arquitetura

O backend é composto por 4 microsserviços principais:

- **api-gateway**: Ponto de entrada único, gerencia roteamento e aplica autenticação/autorização
- **auth-service**: Responsável por login, logout e geração/validação de tokens (JWT e Refresh)
- **user-service**: Gerencia usuários e suas informações (CRUD)
- **quiz-service**: Gerencia conteúdo do jogo (Times, Perguntas e Respostas)

### Bancos de Dados

- **PostgreSQL**: Usado por `user-service`
- **MongoDB**: Usado por `quiz-service`

## Pré-requisitos

- Docker e Docker Compose instalados
- Make (opcional, para usar os comandos simplificados)

## Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações

### 2. Iniciar os Serviços

#### Usando Docker Compose (Produção/Desenvolvimento completo)

```bash
# Construir imagens
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

#### Usando Make

```bash
# Ver comandos disponíveis
make help

# Construir e iniciar tudo
make build
make up

# Ver logs
make logs

# Parar tudo
make down
```

#### Apenas Bancos de Dados (Desenvolvimento Local)

Para desenvolver localmente executando os serviços fora do Docker:

```bash
# Iniciar apenas bancos de dados
make dev-up

# Parar bancos de dados
make dev-down
```

## Serviços e Portas

### Desenvolvimento Local

| Serviço          | Porta Externa | Porta Interna | URL                   |
| ---------------- | ------------- | ------------- | --------------------- |
| **api-gateway**  | 3000          | 3000          | http://localhost:3000 |
| **auth-service** | 3002          | 3000          | http://localhost:3002 |
| **user-service** | 3001          | 3000          | http://localhost:3001 |
| **quiz-service** | 3003          | 3000          | http://localhost:3003 |
| **mongodb**      | 27017         | 27017         | localhost:27017       |

### Produção 

| Serviço         | URL de Produção                                                          |
| --------------- | ------------------------------------------------------------------------ |
| **api-gateway** | https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net |



## Documentação

Cada serviço possui documentação Swagger disponível em:

- **API Gateway**: http://localhost:3000/docs
- **Auth Service**: http://localhost:3002/docs
- **User Service**: http://localhost:3001/docs
- **Quiz Service**: http://localhost:3003/docs

## Fluxo de Requisições

```
React Native App
    ↓
API Gateway (localhost:3000)
    ├─→ /api/auth/* → auth-service:3000
    ├─→ /api/users/* → user-service:3000
    └─→ /api/{teams,questions,answers}/* → quiz-service:3000
```

## Desenvolvimento

### Rodar Serviços Individualmente 

Cada serviço pode ser executado localmente para desenvolvimento:

```bash
# Em cada diretório do serviço
cd api-gateway  # ou auth-service, user-service, quiz-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Estrutura de Pastas

```
backend/
├── api-gateway/        # API Gateway
├── auth-service/       # Serviço de Autenticação
├── user-service/       # Serviço de Usuários
├── quiz-service/       # Serviço de Quiz
├── docker-compose.yml  # Orquestração de produção
├── docker-compose.dev.yml  # Apenas bancos de dados
└── Makefile            # Comandos simplificados
```

## Comandos Úteis

1. Verifique se as portas não estão em uso:

   ```bash
   # Verificar portas
   lsof -i :3000  # API Gateway
   lsof -i :3001  # User Service
   lsof -i :3002  # Auth Service
   lsof -i :3003  # Quiz Service
   ```

2. Verifique os logs:
   ```bash
   docker-compose logs [service-name]
   ```

### Bancos de dados não conectam

1. Verifique se os containers dos bancos estão rodando:

   ```bash
   docker-compose ps
   ```

2. Verifique os healthchecks:
   ```bash
   docker-compose ps
   # Deve mostrar "healthy" para os bancos
   ```

### Reconstruir tudo do zero

```bash
# Parar e remover tudo
docker-compose down -v --remove-orphans

# Limpar imagens (opcional)
docker image prune -a

# Reconstruir e iniciar
docker-compose build --no-cache
docker-compose up -d
```

## Produção

Para produção, certifique-se de:

1. Alterar `JWT_SECRET` para um valor seguro
2. Configurar `DEBUG=false` nos serviços
3. Configurar variáveis de ambiente adequadas
4. Usar HTTPS com reverse proxy (nginx, traefik, etc.)
5. Configurar backup dos bancos de dados
6. Monitoramento e logging apropriados

## Licença

Este projeto faz parte do Soccer Quiz.
