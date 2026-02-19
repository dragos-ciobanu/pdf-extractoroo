.PHONY: up down restart

up:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose down
	docker compose up --build -d
