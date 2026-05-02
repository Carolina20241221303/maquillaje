"""Router de autenticación."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth import AuthService
from app.dependencies import get_current_active_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user = await service.register(data)
    return UserResponse(
        id_usuario=user.id_usuario,
        nombre=user.nombre,
        apellido=user.apellido,
        email=user.email,
        rol=user.rol.nombre_rol,
        activo=user.activo,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: Usuario = Depends(get_current_active_user),
):
    return UserResponse(
        id_usuario=user.id_usuario,
        nombre=user.nombre,
        apellido=user.apellido,
        email=user.email,
        rol=user.rol.nombre_rol,
        activo=user.activo,
    )