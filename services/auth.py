"""Servicio de autenticación: registro, login, refresh."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usuario import Cliente, Usuario
from app.repositories.usuario import RolRepository, UsuarioRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password


class AuthService:

    def __init__(self, db: AsyncSession) -> None:
        self.user_repo = UsuarioRepository(db)
        self.rol_repo = RolRepository(db)

    async def register(self, data: RegisterRequest) -> Usuario:
        # Verificar que el email no esté en uso
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )

        # Obtener rol 'cliente'
        rol = await self.rol_repo.get_by_name("cliente")
        if not rol:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Rol 'cliente' no configurado en la base de datos",
            )

        # Crear usuario
        usuario = Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            password_hash=hash_password(data.password),
            id_rol=rol.id_rol,
        )
        usuario = await self.user_repo.create(usuario)

        # Crear extensión cliente
        cliente = Cliente(
            id_usuario=usuario.id_usuario,
            telefono=data.telefono,
            documento_identidad=data.documento_identidad,
        )
        await self.user_repo.create_cliente(cliente)

        return usuario

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )
        if not user.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cuenta deshabilitada",
            )

        payload = {"sub": str(user.id_usuario), "rol": user.rol.nombre_rol}
        return TokenResponse(
            access_token=create_access_token(payload),
            refresh_token=create_refresh_token(payload),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )

        user = await self.user_repo.get_by_id(int(payload["sub"]))
        if not user or not user.activo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o inactivo",
            )

        new_payload = {"sub": str(user.id_usuario), "rol": user.rol.nombre_rol}
        return TokenResponse(
            access_token=create_access_token(new_payload),
            refresh_token=create_refresh_token(new_payload),
        )
