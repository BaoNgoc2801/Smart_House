FROM python:3.13-slim

WORKDIR /app

# 🔥 FIX LIGHTGBM ERROR
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# install python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy code + models
COPY . .

# run app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "10000"]