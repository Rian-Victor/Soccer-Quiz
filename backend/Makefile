.PHONY: help build up down restart logs clean

help: ## Mostra ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Constrói todas as imagens Docker
	docker-compose build

up: ## Inicia todos os serviços
	docker-compose up -d

down: ## Para todos os serviços
	docker-compose down

restart: ## Reinicia todos os serviços
	docker-compose restart

logs: ## Mostra logs de todos os serviços
	docker-compose logs -f

logs-gateway: ## Mostra logs do API Gateway
	docker-compose logs -f api-gateway

logs-auth: ## Mostra logs do Auth Service
	docker-compose logs -f auth-service

logs-user: ## Mostra logs do User Service
	docker-compose logs -f user-service

logs-quiz: ## Mostra logs do Quiz Service
	docker-compose logs -f quiz-service

clean: ## Remove containers, volumes e redes
	docker-compose down -v --remove-orphans

rebuild: ## Reconstrói e reinicia todos os serviços
	docker-compose up -d --build

ps: ## Lista todos os serviços em execução
	docker-compose ps

# Comandos para desenvolvimento (apenas bancos de dados)
dev-up: ## Inicia apenas os bancos de dados para desenvolvimento local
	docker-compose -f docker-compose.dev.yml up -d

dev-down: ## Para os bancos de dados de desenvolvimento
	docker-compose -f docker-compose.dev.yml down

