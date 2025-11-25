# Configuração de Produção

## URLs de Produção (Azure App Service)

### API Gateway (Produção)

- **URL**: `https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net`
- **Região**: Canada Central (canadacentral-01)
- **Base URL**: `https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/api`

### Documentação Swagger (Produção)

- **Swagger UI**: `https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/docs`
- **ReDoc**: `https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/redoc`

## Configuração do Frontend (React Native)

Para conectar o frontend React Native à API de produção, configure a URL base:

### No arquivo de configuração do React Native:

```typescript
// my-app/config/api.ts ou similar
const API_BASE_URL = __DEV__
  ? "http://localhost:3000/api" // Desenvolvimento local
  : "https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/api"; // Produção

export default API_BASE_URL;
```

### Exemplo de uso no login:

```typescript
// my-app/app/login.tsx
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    // ... resto do código
  } catch (error) {
    // ... tratamento de erro
  }
};
```

## Variáveis de Ambiente para Produção

### No Azure App Service

Configure as seguintes variáveis de ambiente no Azure App Service:

#### API Gateway:

```env
PORT=80
DEBUG=false
JWT_SECRET=<sua-chave-jwt-secreta-producao>
JWT_ALGORITHM=HS256
AUTH_SERVICE_URL=https://auth-service-url.azurewebsites.net
USER_SERVICE_URL=https://user-service-url.azurewebsites.net
QUIZ_SERVICE_URL=https://quiz-service-url.azurewebsites.net
CASBIN_MODEL_PATH=app/casbin/rbac_model.conf
CASBIN_POLICY_PATH=app/casbin/policy.csv
```

#### Auth Service:

```env
PORT=80
DEBUG=false
JWT_SECRET=<mesma-chave-jwt-secreta-producao>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=mssql+pyodbc://username:password@server.database.windows.net:1433/database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
USER_SERVICE_URL=https://user-service-url.azurewebsites.net
```

#### User Service:

```env
PORT=80
DEBUG=false
DATABASE_URL=mssql+pyodbc://username:password@server.database.windows.net:1433/database?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
```

#### Quiz Service:

```env
PORT=80
DEBUG=false
MONGODB_URL=mongodb://mongodb-connection-string
MONGODB_DB=soccer_quiz
```

## Configurar no Azure Portal

1. **Azure Portal** → **App Service** → Seu serviço
2. Vá em **Configuration** → **Application settings**
3. Adicione cada variável de ambiente como um **New application setting**
4. Clique em **Save** para aplicar

## SSL/HTTPS

O Azure App Service já fornece HTTPS automaticamente. Certifique-se de:

1. **Configurar HTTPS** no Azure Portal
2. **Forçar HTTPS** nas configurações do App Service
3. **Atualizar CORS** para aceitar apenas `https://` nas origens permitidas

## CORS para Produção

Certifique-se de que o CORS está configurado corretamente no `api-gateway`:

```python
# backend/api-gateway/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://seu-frontend-domain.com",  # URL do seu frontend em produção
        # Adicione outras origens necessárias
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Health Checks

A URL de produção deve responder nos seguintes endpoints:

- **Root**: `https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/`
- **Health**: `https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/health`

## Monitoramento

Configure monitoramento no Azure:

1. **Application Insights**: Para logs e métricas
2. **Log Stream**: Para ver logs em tempo real
3. **Alerts**: Para notificações de problemas

## Segurança em Produção

**Importante:**

1. Use `JWT_SECRET` forte e único
2. Configure `DEBUG=false` em produção
3. Use HTTPS em todas as conexões
4. Configure firewall do Azure SQL Database
5. Use variáveis de ambiente no Azure App Service (não commite `.env`)
6. Configure CORS restritivo
7. Use Azure Key Vault para secrets sensíveis

## Deploy

### Via Azure CLI:

```bash
# Login
az login

# Deploy
az webapp up --name quiz-service-f5e0h5ctgna2c5a6 --resource-group <resource-group> --runtime "PYTHON:3.11"
```

### Via Azure DevOps:

Veja o arquivo `azure-pipelines.yml` na raiz do projeto.

## Troubleshooting

### Verificar se o serviço está rodando:

```bash
curl https://quiz-service-f5e0h5ctgna2c5a6.canadacentral-01.azurewebsites.net/health
```

### Ver logs no Azure:

1. Portal Azure → App Service → Log stream
2. Ou via Azure CLI: `az webapp log tail --name quiz-service-f5e0h5ctgna2c5a6`

### Verificar variáveis de ambiente:

1. Portal Azure → App Service → Configuration → Application settings
2. Ou via Azure CLI: `az webapp config appsettings list --name quiz-service-f5e0h5ctgna2c5a6`

## Links Úteis

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Azure SQL Database](https://docs.microsoft.com/azure/sql-database/)
