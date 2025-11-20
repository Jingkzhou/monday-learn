from sqlalchemy import text
from app.db.session import engine

def drop_table():
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS learning_progress"))
        conn.commit()
    print("Dropped learning_progress table")

if __name__ == "__main__":
    drop_table()
