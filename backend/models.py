from sqlalchemy import Column, Integer, String, Text, Date
from database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    research_area = Column(String(100), nullable=False)
    faculty_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    required_skills = Column(String(300), nullable=False)
    available_positions = Column(Integer, nullable=False)
    application_deadline = Column(Date, nullable=False)
    status = Column(String(10), nullable=False, default="Open")