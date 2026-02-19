FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY telegram-bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy bot code
COPY telegram-bot/eko-bot.py .

# Copy core data (profile, config)
COPY core/ ./core/

# Create runtime directories
RUN mkdir -p memory/telegram memory/cowork memory/digest data

CMD ["python", "-u", "eko-bot.py"]
