.PHONY: db db-studio db-up db-down

# データベースに接続
db:
	docker exec -it dj-bingo-postgres psql -U username -d djbingo

# Prisma Studioを起動
db-studio:
	npm run db:studio

# PostgreSQLコンテナを起動
db-up:
	docker compose up -d

# PostgreSQLコンテナを停止
db-down:
	docker compose down
