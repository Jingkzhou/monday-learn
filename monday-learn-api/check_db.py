from sqlalchemy import create_engine, inspect
from app.core.config import settings
from app.db.base import Base
from app.models.material import Material

# Initialize the DB engine
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

def check_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in DB: {tables}")
    
    if "materials" in tables:
        print("Table 'materials' exists.")
        columns = [c['name'] for c in inspector.get_columns("materials")]
        print(f"Columns in 'materials': {columns}")
    else:
        print("Table 'materials' does NOT exist.")

if __name__ == "__main__":
    check_tables()
