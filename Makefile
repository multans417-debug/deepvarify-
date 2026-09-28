.PHONY: install dev test lint run docker-build docker-up verify-env

install:
	pip install --break-system-packages .

dev:
	pip install --break-system-packages ".[dev]"

verify-env:
	python scripts/verify_environment.py

test:
	python -m pytest -v

lint:
	ruff check .

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

docker-build:
	docker build -t deepverify .

docker-up:
	docker compose up --build
