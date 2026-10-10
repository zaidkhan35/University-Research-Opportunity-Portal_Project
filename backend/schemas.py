from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OpportunityBase(BaseModel):
    """What the client SENDS (POST and PUT body)"""
    model_config = ConfigDict(str_strip_whitespace=True)    # trims spaces

    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10)
    research_area: str = Field(min_length=2, max_length=100)
    faculty_name: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=100)
    required_skills: str = Field(min_length=2, max_length=300)
    available_positions: int = Field(ge=1, le=100)
    application_deadline: date
    status: Literal["Open", "Closed"] = "Open"

    @field_validator("title", "research_area", "faculty_name", "department", "required_skills")
    @classmethod
    def must_contain_a_letter(cls, value: str) -> str:
        if not any(ch.isalpha() for ch in value):
            raise ValueError("Must contain at least one letter")
        return value


class OpportunityOut(OpportunityBase):
    """What the client RECEIVES (adds the id)"""
    id: int

    model_config = ConfigDict(from_attributes=True)