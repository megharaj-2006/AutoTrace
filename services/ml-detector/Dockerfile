FROM python:3.11-slim
WORKDIR /srv
COPY pyproject.toml .
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" pydantic numpy networkx
COPY app ./app
COPY scripts ./scripts
COPY data ./data
EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=2s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
