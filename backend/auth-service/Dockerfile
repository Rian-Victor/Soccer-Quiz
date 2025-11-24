FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema e drivers ODBC para SQL Server
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    unixodbc-dev \
    curl \
    gnupg \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Copiar e tornar executável o script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expor porta (padrão 3000, será sobrescrita pela variável PORT no runtime)
EXPOSE 3000

# Usar script de entrada que lê PORT do ambiente
ENTRYPOINT ["/docker-entrypoint.sh"]
