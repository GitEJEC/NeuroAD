from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    full_name: str
    role: str  # "therapist" | "patient"
    therapist_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=utcnow)


class ParalysisReport(SQLModel, table=True):
    __tablename__ = "paralysis_report"
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="user.id", index=True)
    pressed_at: datetime = Field(default_factory=utcnow)
    description: Optional[str] = None
    seen_by_therapist: bool = False


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="user.id", index=True)
    title: str
    position: int = 0
    feedback: Optional[str] = None  # "like" | "dislike" | None
    feedback_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class MicroStep(SQLModel, table=True):
    __tablename__ = "micro_step"
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True)
    position: int = 0
    text: str


class EmotionLog(SQLModel, table=True):
    __tablename__ = "emotion_log"
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="user.id", index=True)
    emotion_key: str
    created_at: datetime = Field(default_factory=utcnow)


class Tip(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="user.id", index=True)
    title: str
    body: str
    position: int = 0
