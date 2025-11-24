# API Gateway

API Gateway para o Soccer Quiz - gerencia e roteia requisições do React Native para os microsserviços (auth-service, user-service, quiz-service) com autenticação JWT e autorização Casbin.

Este gateway atua como ponto de entrada único para todas as requisições da interface de usuário, encaminhando-as para os microsserviços apropriados com validação de autenticação e autorização.

## Tecnologias

- **Python 3.11+**
- **FastAPI** - Framework web assíncrono
- **PyJWT** - Validação de tokens JWT
- **python-casbin** - Sistema de autorização baseado em políticas
- **httpx** - Cliente HTTP assíncrono para fazer proxy das requisições
- **uvicorn** - Servidor ASGI de alto desempenho

## Funcionalidades

- **Roteamento**: Encaminha requisições para os microsserviços corretos
- **Autenticação JWT**: Valida tokens JWT e extrai informações do usuário
- **Autorização Casbin**: Verifica permissões baseadas em roles (admin/comum)
- **CORS**: Configurado para permitir requisições do React Native

## Rotas do Gateway

O gateway roteia as requisições com base no prefixo da URL:

- `/api/auth/*` → `auth-service` (autenticação e autorização)
- `/api/users/*` ou `/api/user/*` → `user-service` (gerenciamento de usuários)
- `/api/quiz/*` → `quiz-service` (quizzes)
- `/api/teams/*` → `quiz-service` (times)
- `/api/questions/*` → `quiz-service` (perguntas)
- `/api/answers/*` → `quiz-service` (respostas)

### Exemplos de uso:

```
POST /api/auth/login          → http://auth-service:3000/login
GET  /api/users/1             → http://user-service:3000/1
POST /api/teams               → http://quiz-service:3000/teams
GET  /api/questions             → http://quiz-service:3000/questions
POST /api/answers             → http://quiz-service:3000/answers
```

## Autenticação e Autorização

### JWT Auth Middleware

- Valida tokens JWT no header `Authorization: Bearer <token>`
- Extrai `userId` e `role` do payload
- Permite rotas públicas: `/api/auth/login` e `/api/auth/logout`

### Casbin Authorization Middleware

- Verifica permissões baseadas em role (admin/comum)
- Usa políticas definidas em `app/casbin/policy.csv`
- Retorna `403 Forbidden` se o usuário não tiver permissão

### Políticas de Acesso

**Rotas Públicas (sem autenticação):**

- `/api/auth/login`
- `/api/auth/logout`
- `/` (health check)
- `/health` (health check)
- `/docs` (documentação Swagger)

**Rotas Protegidas:**

- **Admin**: CRUD completo de usuários, times, perguntas e respostas
- **Comum**: Apenas login e logout

## Instalação

### 1. Criar ambiente virtual

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com as configurações apropriadas
```

### 4. Rodar o servidor

```bash
# Modo desenvolvimento (com reload)
uvicorn main:app --reload --host 0.0.0.0 --port 3000

# Ou usando o script principal
python main.py
```

## Estrutura do Projeto

```
api-gateway/
├── app/
│   ├── __init__.py
│   ├── config.py              # Configurações da aplicação
│   ├── casbin/
│   │   ├── rbac_model.conf    # Modelo Casbin
│   │   └── policy.csv         # Políticas de acesso
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── jwt_auth.py        # Middleware de autenticação JWT
│   │   └── casbin_authz.py    # Middleware de autorização Casbin
│   ├── routers/
│   │   ├── __init__.py
│   │   └── gateway.py         # Rotas do gateway
│   └── services/
│       ├── __init__.py
│       └── proxy.py           # Serviço de proxy
├── main.py                     # Entry point da aplicação
├── requirements.txt            # Dependências Python
├── .env.example               # Exemplo de variáveis de ambiente
└── README.md                  # Este arquivo
```

## Variáveis de Ambiente

| Variável             | Descrição                     | Padrão                                |
| -------------------- | ----------------------------- | ------------------------------------- |
| `PORT`               | Porta do API Gateway          | `3000`                                |
| `DEBUG`              | Modo debug                    | `true`                                |
| `JWT_SECRET`         | Secret para validação de JWT  | `default-secret-change-in-production` |
| `JWT_ALGORITHM`      | Algoritmo JWT                 | `HS256`                               |
| `AUTH_SERVICE_URL`   | URL do auth-service           | `http://auth-service:3000`            |
| `USER_SERVICE_URL`   | URL do user-service           | `http://user-service:3000`            |
| `QUIZ_SERVICE_URL`   | URL do quiz-service           | `http://quiz-service:3000`            |
| `CASBIN_MODEL_PATH`  | Caminho para modelo Casbin    | `app/casbin/rbac_model.conf`          |
| `CASBIN_POLICY_PATH` | Caminho para políticas Casbin | `app/casbin/policy.csv`               |

## Documentação

A documentação interativa da API está disponível em:

- **Swagger UI**: `http://localhost:3000/docs`
- **ReDoc**: `http://localhost:3000/redoc`

## Desenvolvimento

### Executar testes

```bash
# Instalar dependências de desenvolvimento
pip install pytest pytest-asyncio httpx

# Executar testes
pytest
```

### Linting

```bash
# Instalar ferramentas de lint
pip install black flake8 mypy

# Formatar código
black .

# Verificar estilo
flake8 .

# Verificar tipos
mypy .
```

## Licença

Este projeto faz parte do Soccer Quiz e está sujeito à mesma licença do projeto principal.
