from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    print("Connected! Result:", conn.execute(text("SELECT 1")).scalar())
    print("Database:", conn.execute(text("SELECT DATABASE()")).scalar())