# Nexturna Backend

Backend para el sistema de gestión de turnos por WhatsApp.

## 🚀 Tecnologías

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Docker

## 📋 Requisitos previos

- Node.js 18+
- pnpm 8+ (se recomienda sobre npm/yarn)
- PostgreSQL 14+
- Docker (opcional)

## 🛠️ Instalación

1. Clonar el repositorio
2. Instalar pnpm (si no lo tienes):

```bash
npm install -g pnpm
```

3. Instalar dependencias:

```bash
pnpm install
```

4. Copiar el archivo de entorno:

```bash
cp .env.example .env
```

5. Configurar las variables de entorno en `.env`

6. Iniciar en modo desarrollo:

```bash
pnpm run start:dev
```

## 🐳 Docker - Modos de Trabajo

Existen **3 modos de trabajo** dependiendo de tu flujo de desarrollo:

---

## 🚀 MODO 1: Desarrollo Local (RECOMENDADO para desarrollo activo)

**Uso:** Backend en tu PC + Base de datos en Docker

**Ventajas:**
- ✅ Hot-reload **instantáneo** (cambios se ven al instante)
- ✅ Debugging más fácil con VS Code
- ✅ No esperar reconstrucción de Docker
- ✅ Usa menos recursos

### Paso 1: Levantar solo PostgreSQL y pgAdmin

Desde la raíz del proyecto `TurnoYa/`:

```bash
docker-compose -f docker-compose.db-only.yml up -d
```

Esto levanta:
- PostgreSQL en `localhost:5432`
- pgAdmin en `http://localhost:5050`

### Paso 2: Instalar dependencias (solo la primera vez)

```bash
cd backend
npm install
```

### Paso 3: Correr el backend localmente

```bash
npm run start:dev
```

El backend estará en `http://localhost:3000` con hot-reload automático.

### ⚡ Workflow diario en modo local:

```bash
# 1. Levantar base de datos
docker-compose -f docker-compose.db-only.yml up -d

# 2. Correr backend en local
cd backend
npm run start:dev

# 3. Hacer cambios en el código (se reflejan automáticamente)

# 4. Detener al finalizar
# Ctrl+C para detener backend
docker-compose -f docker-compose.db-only.yml down
```

---

## 🔧 MODO 2: Docker Completo - Desarrollo (hot-reload en Docker)

**Uso:** Backend + Base de datos + pgAdmin en Docker

**Ventajas:**
- ✅ Entorno idéntico para todo el equipo
- ✅ No requiere Node.js instalado en tu PC
- ✅ Hot-reload funcional (más lento que local)

### Levantar contenedores:

Desde la raíz del proyecto `TurnoYa/`:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Esto levanta:
- Backend en `http://localhost:3001`
- PostgreSQL en `localhost:5433`
- pgAdmin en `http://localhost:5051`

### 🔄 Actualizar después de cambios en código TypeScript:

```bash
# Restart rápido (para cambios en .ts)
docker-compose -f docker-compose.dev.yml restart backend-dev

# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f backend-dev
```

### 🔄 Actualizar después de cambios en package.json:

```bash
# Rebuild completo (cuando agregas/eliminas dependencias)
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

### Detener contenedores:

```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 📦 MODO 3: Docker Producción (sin hot-reload)

**Uso:** Despliegue en servidor o testing de producción

**Características:**
- ✅ Imagen optimizada y compilada
- ✅ Sin volúmenes de código (inmutable)
- ✅ Reinicio automático en caso de fallo

### Levantar en modo producción:

Desde la raíz del proyecto `TurnoYa/`:

```bash
docker-compose up -d
```

Esto levanta:
- Backend en `http://localhost:3000` (modo producción)
- PostgreSQL en `localhost:5432`
- pgAdmin en `http://localhost:5050`

### Actualizar después de cambios:

```bash
# Rebuild completo
docker-compose down
docker-compose up -d --build
```

---

## 📊 Comparación de Modos

| Característica | Local + DB Docker | Docker Dev | Docker Prod |
|----------------|-------------------|------------|-------------|
| **Hot-reload** | ⚡ Instantáneo | 🐢 Lento | ❌ No |
| **Debugging** | ✅ Fácil | ⚠️ Complejo | ❌ No |
| **Node.js en PC** | ✅ Requerido | ❌ No requerido | ❌ No requerido |
| **Portabilidad** | ⚠️ Media | ✅ Alta | ✅ Alta |
| **Uso de recursos** | 💚 Bajo | 💛 Medio | 💚 Bajo |
| **Cuándo usar** | Desarrollo activo | Testing equipo | Producción |

---

## 📋 Comandos Útiles Docker

### Ver estado de contenedores:
```bash
docker ps
```

### Ver logs:
```bash
# Backend
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# PostgreSQL
docker-compose -f docker-compose.dev.yml logs -f postgres

# Todos
docker-compose -f docker-compose.dev.yml logs -f
```

### Limpiar y reiniciar todo:
```bash
# Detener y eliminar contenedores + volúmenes (⚠️ borra la BD)
docker-compose -f docker-compose.dev.yml down -v

# Reconstruir desde cero
docker-compose -f docker-compose.dev.yml up -d --build
```

### Acceder a contenedor:
```bash
# Backend
docker-compose -f docker-compose.dev.yml exec backend-dev sh

# PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U turnoya -d turnoya_db
```

---

## 🔐 Acceso a pgAdmin

- **URL:** `http://localhost:5051`
- **Email:** `admin@turnoya.com`
- **Password:** `admin`

### Conectar a PostgreSQL desde pgAdmin:
- **Host:** `postgres` (nombre del servicio Docker)
- **Puerto:** `5432`
- **Usuario:** `turnoya`
- **Password:** `turnoya_password`
- **Base de datos:** `turnoya_db`

---

## 🎯 Resumen: ¿Qué comando usar?

### Durante desarrollo diario (RECOMENDADO):
```bash
# Levantar solo DB
docker-compose -f docker-compose.db-only.yml up -d

# Backend local
cd backend
npm run start:dev
```

### Para probar todo en Docker:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Para producción/servidor:
```bash
docker-compose up -d
```

## 📚 Estructura del proyecto

```
src/
├── modules/         # Módulos de la aplicación
│   ├── queue/      # Gestión de cola
│   ├── users/      # Gestión de usuarios
│   └── notifications/  # Notificaciones
├── services/        # Servicios externos
│   ├── whatsapp.service.ts
│   └── notification.service.ts
├── common/          # Recursos compartidos
│   ├── filters/
│   ├── interceptors/
│   └── middlewares/
├── app.module.ts    # Módulo principal
├── main.ts          # Punto de entrada
└── config.ts        # Configuración
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 📝 Scripts disponibles

- `npm run start:dev` - Inicia en modo desarrollo
- `npm run start:prod` - Inicia en modo producción
- `npm run build` - Compila el proyecto
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código

## 🔗 API Endpoints

### Queue
- `GET /api/v1/queue` - Obtener cola actual
- `POST /api/v1/queue` - Agregar a la cola
- `PUT /api/v1/queue/:id` - Actualizar turno
- `DELETE /api/v1/queue/:id` - Eliminar turno
- `POST /api/v1/queue/next` - Siguiente turno
- `POST /api/v1/queue/complete/:id` - Completar turno

### Users
- `GET /api/v1/users/:id` - Obtener usuario
- `POST /api/v1/users` - Crear usuario
- `PUT /api/v1/users/:id` - Actualizar usuario
- `GET /api/v1/users/:id/settings` - Obtener configuración

### Notifications
- `POST /api/v1/notifications/send` - Enviar notificación
- `POST /api/v1/notifications/queue-update` - Notificar cambio en cola

## 📄 Licencia

MIT
