import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            amount REAL,
            fraud_probability REAL,
            is_fraud BOOLEAN,
            explanation TEXT,
            status TEXT DEFAULT 'Pending' -- 'Pending', 'Blocked', 'Flagged', 'Cleared'
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized.")

if __name__ == "__main__":
    init_db()
