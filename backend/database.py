from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
)

Base = declarative_base()                       # parent of all table classes
engine = create_engine(DATABASE_URL)            # connection manager
SessionLocal = sessionmaker(bind=engine)        # session factory


def get_db():
    db = SessionLocal()      # 1. open a session for this request
    try:
        yield db             # 2. give it to the route
    finally:
        db.close()           # 3. always close it