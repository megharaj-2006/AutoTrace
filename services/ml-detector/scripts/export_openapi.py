#!/usr/bin/env python3
"""Export the API contract so other members can code against it.

  python scripts/export_openapi.py ../../shared/schemas/ml-detector-openapi.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.main import app  # noqa: E402

out = Path(sys.argv[1] if len(sys.argv) > 1 else "openapi.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(app.openapi(), indent=2))
print("wrote", out)
