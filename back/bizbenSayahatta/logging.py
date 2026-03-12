import json
import logging
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        for key in ("request_id", "path", "method", "user_id", "role", "status_code", "error_id", "remote_addr"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value

        return json.dumps(payload, ensure_ascii=True)
