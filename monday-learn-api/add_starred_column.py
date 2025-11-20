import pymysql
import os

# DB Config
DB_HOST = "127.0.0.1"
DB_USER = "root"
DB_PASS = "a8548879"
DB_NAME = "learndb"

def add_column():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection:
            with connection.cursor() as cursor:
                # Check if column exists first to avoid error
                cursor.execute("SELECT count(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'terms' AND COLUMN_NAME = 'starred'", (DB_NAME,))
                if cursor.fetchone()['count(*)'] > 0:
                    print("Column 'starred' already exists.")
                    return

                print("Adding 'starred' column to 'terms' table...")
                sql = "ALTER TABLE terms ADD COLUMN starred BOOLEAN NOT NULL DEFAULT FALSE"
                cursor.execute(sql)
                connection.commit()
                print("Column added successfully.")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
