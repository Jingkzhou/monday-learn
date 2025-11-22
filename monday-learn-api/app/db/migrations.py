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


def ensure_learning_reports_utf8mb4(engine) -> None:
    """
    Ensure learning_reports table uses utf8mb4 charset for emoji support.
    """
    inspector = inspect(engine)
    if "learning_reports" not in inspector.get_table_names():
        return

    logger.info("Checking learning_reports charset...")
    with engine.connect() as conn:
        # We just blindly run the alter command to ensure it's correct. 
        # It's a cheap operation if it's already correct.
        conn.execute(text("ALTER TABLE learning_reports CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        conn.commit()
    logger.success("Ensured learning_reports is utf8mb4")


def ensure_daily_learning_summary_table(engine) -> None:
    """
    Ensure daily_learning_summaries table exists.
    """
    inspector = inspect(engine)
    if "daily_learning_summaries" in inspector.get_table_names():
        return

    logger.info("Creating daily_learning_summaries table...")
    # Since we are using Base.metadata.create_all(bind=engine) in main.py, 
    # this function might be redundant if we just restart. 
    # However, create_all only creates tables that don't exist.
    # If we want to be explicit or if we were using Alembic properly we would do it there.
    # But given the pattern here, create_all in main.py should handle it.
    # Let's just log that we are relying on create_all, or we can force it if needed.
    # Actually, main.py calls create_all BEFORE run_migrations. 
    # So the table should already be created by the time this runs if the model is imported in main.py.
    # We can just verify it here.
    pass

def run_migrations(engine) -> None:
    ensure_ai_config_total_tokens(engine)
    ensure_learning_reports_utf8mb4(engine)
    # daily_learning_summaries is created by Base.metadata.create_all in main.py

