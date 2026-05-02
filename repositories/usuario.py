"""Repositorio de Usuarios, Roles y Clientes."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.usuario import Cliente, Rol, Usuario


class UsuarioRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: int) -> Usuario | None:
        stmt = (
            select(Usuario)
            .options(selectinload(Usuario.rol))
            .where(Usuario.id_usuario == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Usuario | None:
        stmt = (
            select(Usuario)
            .options(selectinload(Usuario.rol))
            .where(Usuario.email == email)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[Usuario]:
        stmt = (
            select(Usuario)
            .options(selectinload(Usuario.rol))
            .offset(skip)
            .limit(limit)
            .order_by(Usuario.id_usuario)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        await self.db.flush()
        await self.db.refresh(usuario, attribute_names=["rol"])
        return usuario

    async def update(self, usuario: Usuario, data: dict) -> Usuario:
        for key, value in data.items():
            if value is not None:
                setattr(usuario, key, value)
        await self.db.flush()
        await self.db.refresh(usuario)
        return usuario

    async def create_cliente(self, cliente: Cliente) -> Cliente:
        self.db.add(cliente)
        await self.db.flush()
        await self.db.refresh(cliente)
        return cliente

    async def get_cliente(self, user_id: int) -> Cliente | None:
        stmt = select(Cliente).where(Cliente.id_usuario == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_cliente(self, cliente: Cliente, data: dict) -> Cliente:
        for key, value in data.items():
            if value is not None:
                setattr(cliente, key, value)
        await self.db.flush()
        await self.db.refresh(cliente)
        return cliente


class RolRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_name(self, name: str) -> Rol | None:
        stmt = select(Rol).where(Rol.nombre_rol == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, rol_id: int) -> Rol | None:
        stmt = select(Rol).where(Rol.id_rol == rol_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Rol]:
        stmt = select(Rol).order_by(Rol.id_rol)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
