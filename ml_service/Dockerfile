FROM python:3.11-slim

WORKDIR /code

# Install system dependencies needed for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from ml_service
COPY ml_service/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Create a non-root user that Hugging Face Spaces requires
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy the ml_service code and the ml code
# We copy ml_service to $HOME/app/ml_service and ml to $HOME/app/ml
COPY --chown=user ml/ ./ml/
COPY --chown=user ml_service/ ./ml_service/

WORKDIR $HOME/app/ml_service

EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
