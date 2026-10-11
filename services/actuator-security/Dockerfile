# ==============================================================================
# AutoTrace-Sec: Security Actuator Container Image
# Port: 8081 | Role: Member 4 (Cybersecurity & Containment Engineer)
# ==============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install curl for container health checks and iptables for Mechanism B
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    iptables \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy actuator source code and policies
COPY src/ ./src/
COPY policies/ ./policies/
COPY pki/ ./pki/

# Default runtime configuration
ENV ACTUATOR_SECURITY_PORT=8081
ENV ACTUATOR_HOST=0.0.0.0
ENV ACTUATOR_DRY_RUN=false
ENV ACTUATOR_DOCKER_NETWORK=autotrace-mesh

# Expose frozen actuator port
EXPOSE 8081

# Docker healthcheck
HEALTHCHECK --interval=10s --timeout=3s --retries=3 --start-period=5s \
    CMD curl -f http://127.0.0.1:8081/health || exit 1

# Start uvicorn server via entrypoint module
CMD ["python", "-m", "src.main"]
