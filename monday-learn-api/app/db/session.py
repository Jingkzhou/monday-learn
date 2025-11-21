from sqlalchemy import create_engine, event
from loguru import logger
from time import perf_counter
from app.core.config import APP_ENV
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Enable SQL echo/monitoring in dev to print all executed statements with timing
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    echo=APP_ENV == "dev",
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# When running in dev, log every SQL statement and execution time
if APP_ENV == "dev":
    @event.listens_for(engine, "before_cursor_execute")
    def _query_start(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("query_start_time", []).append(perf_counter())
        logger.info(f"SQL START: {statement}; params={parameters}")

    @event.listens_for(engine, "after_cursor_execute")
    def _query_end(conn, cursor, statement, parameters, context, executemany):
        start = conn.info.get("query_start_time", []).pop(-1)
        duration_ms = (perf_counter() - start) * 1000
        logger.info(f"SQL END  : {statement}; params={parameters}; duration={duration_ms:.2f}ms")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
