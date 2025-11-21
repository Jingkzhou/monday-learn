from sqlalchemy import inspect, text
from loguru import logger


def ensure_ai_config_total_tokens(engine) -> None:
    """
    Add ai_configs.total_tokens if the column is missing.
    Keeps deployments without migrations from breaking once the model changes.
    """
    inspector = inspect(engine)
    if "ai_configs" not in inspector.get_table_names():
        logger.warning("ai_configs table missing; skipping total_tokens migration")
        return

    column_names = [col["name"] for col in inspector.get_columns("ai_configs")]
    if "total_tokens" in column_names:
        return

    logger.info("Adding total_tokens column to ai_configs table")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE ai_configs ADD COLUMN total_tokens INT DEFAULT 0"))
        conn.commit()
    logger.success("Added total_tokens column to ai_configs table")


def run_migrations(engine) -> None:
    ensure_ai_config_total_tokens(engine)
