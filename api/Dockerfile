# Flask API Dockerfile
# Base image: recent stable slim Python
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies (add more as needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------
# Dependencies layer: copy only requirements first for caching
# ------------------------------------------------------------
COPY requirements.txt ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else echo "(No requirements.txt yet)"; fi

# ------------------------------------------------------------
# Application source
# ------------------------------------------------------------
COPY . .

EXPOSE 5000

# Replace placeholder CMD with gunicorn (after app + wsgi exist)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "wsgi:app"]
