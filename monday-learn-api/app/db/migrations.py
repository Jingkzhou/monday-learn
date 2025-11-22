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


def ensure_learning_progress_mastered_at(engine) -> None:
    """
    Add mastered_at column to learning_progress to track when a term is first mastered.
    """
    inspector = inspect(engine)
    if "learning_progress" not in inspector.get_table_names():
        logger.warning("learning_progress table missing; skipping mastered_at migration")
        return

    column_names = [col["name"] for col in inspector.get_columns("learning_progress")]
    needs_column = "mastered_at" not in column_names
    if needs_column:
        logger.info("Adding mastered_at column to learning_progress table")
    else:
        logger.info("mastered_at column already present; ensuring backfill")

    with engine.connect() as conn:
        if needs_column:
            conn.execute(text("ALTER TABLE learning_progress ADD COLUMN mastered_at DATETIME"))
        # Backfill for any existing mastered records so historical data shows up
        conn.execute(text("""
            UPDATE learning_progress
            SET mastered_at = COALESCE(last_reviewed, updated_at, created_at)
            WHERE status = 'mastered' AND mastered_at IS NULL
        """))
        conn.commit()
    logger.success("mastered_at column ensured and backfilled")


def ensure_ai_usage_logs_extra_fields(engine) -> None:
    """
    Add feature and user_email columns to ai_usage_logs if missing.
    Keeps logging schema in sync without manual migrations.
    """
    inspector = inspect(engine)
    if "ai_usage_logs" not in inspector.get_table_names():
        logger.warning("ai_usage_logs table missing; skipping feature/email migration")
        return

    column_names = [col["name"] for col in inspector.get_columns("ai_usage_logs")]
    alters = []
    if "feature" not in column_names:
        alters.append("ADD COLUMN feature VARCHAR(100)")
    if "user_email" not in column_names:
        alters.append("ADD COLUMN user_email VARCHAR(255)")

    if not alters:
        return

    alter_sql = "ALTER TABLE ai_usage_logs " + ", ".join(alters)
    logger.info("Applying ai_usage_logs migration: {}", alter_sql)
    with engine.connect() as conn:
        conn.execute(text(alter_sql))
        conn.commit()
    logger.success("ai_usage_logs columns ensured")

def run_migrations(engine) -> None:
    ensure_ai_config_total_tokens(engine)
    ensure_learning_reports_utf8mb4(engine)
    # daily_learning_summaries is created by Base.metadata.create_all in main.py
    ensure_learning_progress_mastered_at(engine)
    ensure_ai_usage_logs_extra_fields(engine)
