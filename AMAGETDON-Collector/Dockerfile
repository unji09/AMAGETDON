FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y ca-certificates

COPY . .

ENV TZ=Asia/Seoul
ENV PYTHONPATH=/app

CMD ["python", "app/main.py"]