.PHONY: up down restart logs clean bootstrap db-generate db-migrate db-seed

up:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose down
	docker compose up --build -d

logs:
	docker compose logs -f --tail=200 api worker web

clean:
	docker compose down -v

bootstrap: up db-migrate db-seed

db-generate:
	docker compose exec api npm run prisma:generate
	docker compose exec worker npm run prisma:generate

db-migrate:
	docker compose exec api npm run prisma:migrate

db-seed:
	docker compose exec api npm run prisma:seed
