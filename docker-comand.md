# Comandos Basicos Backend + Docker

## 1) Ir al proyecto

```bash
cd /home/pablo-dev/App_Turnos/turnoya-queue-system
```

## 2) Ver cambios locales

```bash
git status
```

## 3) Bajar contenedores

```bash
docker compose -f docker-compose.yml -p turnoya-queue-system down
```

## 4) Reconstruir backend con cambios locales

```bash
docker compose -f docker-compose.yml -p turnoya-queue-system build backend
```

## 5) Levantar postgres + backend

```bash
docker compose -f docker-compose.yml -p turnoya-queue-system up -d postgres backend
```

## 6) Ver estado de contenedores

```bash
docker compose -f docker-compose.yml -p turnoya-queue-system ps
```

## 7) Ver logs del backend

```bash
docker compose -f docker-compose.yml -p turnoya-queue-system logs -f --tail=200 backend
```

## 8) Rebuild forzado (si Docker cachea y no toma cambios)

```bash
docker compose -f docker-compose.yml -p turnoya-queue-system build --no-cache backend
docker compose -f docker-compose.yml -p turnoya-queue-system up -d backend
```

## 9) Comandos backend en local (sin Docker)

```bash
cd /home/pablo-dev/App_Turnos/turnoya-queue-system/backend
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm start:dev
```

## 10) Flujo rapido de 3 comandos para actualizar Docker test

```bash
cd /home/pablo-dev/App_Turnos/turnoya-queue-system
docker compose -f docker-compose.yml -p turnoya-queue-system down
docker compose -f docker-compose.yml -p turnoya-queue-system up -d --build postgres backend
```
