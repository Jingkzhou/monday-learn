from sqlalchemy import create_engine, inspect
from app.core.config import settings
from app.db.base import Base
from app.models.material import Material

# Initialize the DB engine
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

def check_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables found:", tables)
    
    if "learning_progress" in tables:
        print("✅ LearningProgress table exists")
    else:
        print("❌ LearningProgress table MISSING")

if __name__ == "__main__":
    check_tables()
