# Use a base image with Python
FROM python:3.11-slim

# Install system dependencies required by Manim
# This is the CRITICAL part that Vercel serverless can't do
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    libpango1.0-dev \
    libcairo2-dev \
    pkg-config \
    python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install LaTeX packages separately (optional - remove if not needed)
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["flask", "--app", "app:app", "run", "--host=0.0.0.0", "--port=8080"]