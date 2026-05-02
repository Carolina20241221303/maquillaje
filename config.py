"""Configuración centralizada del proyecto con pydantic-settings."""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # ── Base de datos ──
    DATABASE_URL: str

    # ── Seguridad / JWT ──
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 1440

    # ── Entorno ──
    ENVIRONMENT: str = "development"

    # ── CORS ──
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """
        Normaliza DATABASE_URL para despliegues (Render):
        - postgres://...        -> postgresql+asyncpg://...
        - postgresql://...      -> postgresql+asyncpg://...
        - postgresql+asyncpg://postgresql://... (duplicada) -> postgresql+asyncpg://...
        """
        if not isinstance(v, str):
            raise ValueError("DATABASE_URL debe ser string")

        url = v.strip().strip('"').strip("'")
        url = url.replace("postgres://", "postgresql://", 1)

        dup = "postgresql+asyncpg://postgresql://"
        if url.startswith(dup):
            url = "postgresql+asyncpg://" + url[len(dup):]

        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]

        if not url.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL debe iniciar con postgresql+asyncpg://")

        return url

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY debe tener al menos 32 caracteres")
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
