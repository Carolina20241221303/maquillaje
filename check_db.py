"""Verificar que la BD se creó correctamente."""
import asyncio
import asyncpg
from app.config import get_settings

settings = get_settings()

async def check_tables():
    url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "")
    user_pass, rest = url.split("@")
    db_user, db_pass = user_pass.split(":")
    host_port, db_name = rest.split("/")
    host, port = host_port.split(":") if ":" in host_port else (host_port, "5432")

    conn = await asyncpg.connect(user=db_user, password=db_pass, host=host, port=int(port), database=db_name)
    tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'tienda'")
    print(f"✅ Total tablas: {len(tables)}")
    for t in tables:
        print(f"  • {t['table_name']}")
    roles = await conn.fetch("SELECT * FROM tienda.rol")
    print(f"\n✅ Roles: {len(roles)}")
    for r in roles:
        print(f"  • {r['nombre_rol']}")
    await conn.close()

asyncio.run(check_tables())
