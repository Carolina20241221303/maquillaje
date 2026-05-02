# ── Stage: producción ──
FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY app/ ./app/
COPY static/ ./static/
COPY script_db.txt .
COPY check_db.py .
COPY create_users.py .

# Crear directorio de uploads y logs
RUN mkdir -p static/uploads logs

# Usuario no-root por seguridad
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD sh -c 'curl -f "http://localhost:${PORT:-8000}/health" || exit 1'

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4"]
