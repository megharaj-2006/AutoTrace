"""
Entry point for the AutoTrace-Sec Security Actuator.

Usage:
    python -m src.main
    # or
    uvicorn src.app:app --host 0.0.0.0 --port 8081
"""

import uvicorn

from .app import app
from .config import ActuatorConfig


def main() -> None:
    """Start the actuator server."""
    config = ActuatorConfig()
    uvicorn.run(
        "src.app:app",
        host=config.host,
        port=config.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
