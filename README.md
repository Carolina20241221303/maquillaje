# 🛍️ Tienda de Maquillaje — Fullstack (FastAPI + React)

Backend **FastAPI + PostgreSQL** · Frontend **React + Vite + Redux** · Deploy con **Docker**

---

## 📁 Estructura

```
├── app/                        # Backend FastAPI
│   ├── config.py               # Configuración (pydantic-settings)
│   ├── database.py             # SQLAlchemy async
│   ├── main.py                 # App, CORS, routers
│   ├── security.py             # bcrypt + JWT
│   ├── models/ repositories/ routers/ schemas/ services/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/              # Dashboard, Tienda, Carrito…
│   │   ├── components/         # Sidebar, Header
│   │   ├── services/api.ts     # Axios (VITE_API_URL)
│   │   ├── store/              # Redux slices
│   │   └── types/
│   ├── Dockerfile              # Build React + Nginx
│   └── nginx-frontend.conf     # SPA + proxy al backend
├── Dockerfile                  # Backend Python
├── docker-compose.yml          # LOCAL  (postgres + backend + frontend)
├── docker-compose.prod.yml     # PROD   (backend + frontend, BD externa)
├── .env.docker                 # Plantilla para docker local
├── .env.production.example     # Plantilla para producción
├── script_db.txt               # Schema SQL completo
├── create_users.py             # Usuarios iniciales
└── check_db.py                 # Verifica la BD
```

---

## 🐳 Inicio rápido — LOCAL con Docker

> Requisito: tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

```bash
# 1. Copiar variables de entorno
cp .env.docker .env

# 2. Levantar todo (BD + backend + frontend)
docker compose up --build
```

Eso es todo. Docker levanta automáticamente:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

Los usuarios iniciales se crean automáticamente:

| Rol | Email | Contraseña |
|---|---|---|
| admin | admin@tienda.com | admin123456 |
| inventario | inventario@tienda.com | inventario123456 |

### Comandos útiles en local

```bash
# Ver logs en vivo
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Detener todo
docker compose down

# Detener y borrar la BD (reset completo)
docker compose down -v
```

---

## 🚀 Deploy a PRODUCCIÓN con Docker

### En un VPS (Ubuntu/Debian)

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh

# 2. Clonar el repositorio
git clone <repo> /var/www/tienda
cd /var/www/tienda

# 3. Configurar variables de producción
cp .env.production.example .env
nano .env   # Rellenar DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS

# 4. Deploy
docker compose -f docker-compose.prod.yml up -d --build
```

### En Render / Railway

Estos servicios despliegan contenedores directamente desde el `Dockerfile` del backend.

**Backend (Web Service):**
- Root directory: `.` (raíz del repo)
- Dockerfile: `./Dockerfile`
- Variables de entorno en el dashboard:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | resultado de `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | `https://tu-frontend.onrender.com` |

**Frontend (Static Site o Web Service):**
- Root directory: `./frontend`
- Dockerfile: `./frontend/Dockerfile`
- Build arg: `VITE_API_URL=https://tu-backend.onrender.com`

---

## 🔐 Variables de entorno

### Backend (`.env`)

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/db` | ✅ |
| `SECRET_KEY` | Mínimo 32 caracteres | ✅ |
| `ENVIRONMENT` | `development` o `production` | No (def: development) |
| `ALGORITHM` | Algoritmo JWT | No (def: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | No (def: 30) |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | | No (def: 1440) |
| `ALLOWED_ORIGINS` | URLs CORS separadas por coma | No |

> Con `ENVIRONMENT=production` los endpoints `/docs` y `/redoc` se deshabilitan.

### Frontend (build arg)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | En Docker se usa `/api` (nginx proxy). En Render: URL completa del backend. |

---

## 🛡️ Checklist antes de producción

- [ ] `SECRET_KEY` generada con `secrets.token_hex(32)`
- [ ] `ENVIRONMENT=production`
- [ ] `ALLOWED_ORIGINS` apunta solo a tu dominio
- [ ] `.env` NO commiteado al repo
- [ ] Contraseñas de usuarios iniciales cambiadas
- [ ] HTTPS configurado
