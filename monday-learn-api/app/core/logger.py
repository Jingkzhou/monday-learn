import logging
import sys
from loguru import logger
from app.core.config import settings

class InterceptHandler(logging.Handler):
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )

def setup_logging():
    # Intercept everything that goes to standard logger
    logging.root.handlers = [InterceptHandler()]
    logging.root.setLevel(logging.INFO)

    # Remove all existing loggers and configure loguru
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True

    # Configure loguru
    logger.configure(
        handlers=[
            {"sink": sys.stdout, "serialize": False},
            {"sink": "logs/app.log", "rotation": "500 MB", "retention": "10 days", "serialize": True},
        ]
    )
