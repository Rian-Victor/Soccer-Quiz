FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
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
