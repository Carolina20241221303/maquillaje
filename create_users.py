"""Script para crear usuarios iniciales (solo usar en setup)."""
import asyncio
import asyncpg
from urllib.parse import parse_qs, unquote, urlparse

from app.security import hash_password
from app.config import get_settings

settings = get_settings()


def _get_db_conn_kwargs(database_url: str) -> dict:
    """
    Convierte DATABASE_URL (SQLAlchemy style) en kwargs para asyncpg.connect.
    Soporta credenciales con caracteres especiales y query params (p.ej. sslmode=require).
    """
    normalized = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    parsed = urlparse(normalized)

    if parsed.scheme not in {"postgresql", "postgres"}:
        raise ValueError("DATABASE_URL debe usar esquema postgresql:// o postgresql+asyncpg://")

    db_name = parsed.path.lstrip("/")
    if not db_name:
        raise ValueError("DATABASE_URL no incluye nombre de base de datos")

    kwargs = {
        "user": unquote(parsed.username) if parsed.username else None,
        "password": unquote(parsed.password) if parsed.password else None,
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "database": db_name,
    }

    # Render suele usar ?sslmode=require
    query = parse_qs(parsed.query or "")
    sslmode = (query.get("sslmode") or [None])[0]
    if sslmode and sslmode.lower() in {"require", "verify-ca", "verify-full"}:
        kwargs["ssl"] = "require"

    return kwargs


async def create_users():
    """Crea usuarios base (admin, inventario y cliente) en la BD."""
    conn = await asyncpg.connect(**_get_db_conn_kwargs(settings.DATABASE_URL))

    try:
        admin_role = await conn.fetchval("SELECT id_rol FROM tienda.rol WHERE nombre_rol = 'admin'")
        inv_role = await conn.fetchval("SELECT id_rol FROM tienda.rol WHERE nombre_rol = 'inventario'")
        cliente_role = await conn.fetchval("SELECT id_rol FROM tienda.rol WHERE nombre_rol = 'cliente'")

        usuarios_seed = [
            ("admin@tienda.com", "Administrador", "Sistema", "admin123456", admin_role, False),
            ("inventario@tienda.com", "Gerente", "Inventario", "inventario123456", inv_role, False),
            ("juan@example.com", "Juan", "Cliente", "password123456", cliente_role, True),
        ]

        for email, nombre, apellido, password, role, es_cliente in usuarios_seed:
            try:
                await conn.execute(
                    "INSERT INTO tienda.usuario (nombre, apellido, email, password_hash, id_rol, activo) "
                    "VALUES ($1, $2, $3, $4, $5, TRUE)",
                    nombre, apellido, email, hash_password(password), role
                )
                print(f"✅ {email} creado")
            except Exception as e:
                print(f"⚠️  {email}: {e}")

            if es_cliente:
                user_id = await conn.fetchval(
                    "SELECT id_usuario FROM tienda.usuario WHERE email = $1",
                    email,
                )
                if user_id:
                    await conn.execute(
                        "INSERT INTO tienda.cliente (id_usuario, telefono, documento_identidad) "
                        "VALUES ($1, $2, $3) "
                        "ON CONFLICT (id_usuario) DO NOTHING",
                        user_id,
                        "3000000000",
                        "CC-1000000000",
                    )
                    print(f"✅ cliente perfil para {email}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_users())
