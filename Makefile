.PHONY: help up down restart logs build clean

help:
	@echo "Panel de Control - Brevo"
	@echo "========================"
	@echo ""
	@echo "make up       Levantar aplicación"
	@echo "make down     Detener aplicación"
	@echo "make restart  Reiniciar"
	@echo "make logs     Ver logs"
	@echo "make build    Reconstruir imagen"
	@echo "make clean    Eliminar todo (incluyendo BD)"
	@echo ""

up:
	@[ -f .env ] || cp .env.example .env
	@docker-compose up -d
	@echo "✅ Aplicación en http://localhost:3000"

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

build:
	docker-compose build --no-cache

clean:
	docker-compose down -v

.DEFAULT_GOAL := help
