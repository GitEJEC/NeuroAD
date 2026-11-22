from datetime import datetime
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlmodel import Session, select

from app.emotions import EMOTION_KEYS
from app.models import MicroStep, Task


Range = Literal["day", "week", "month"]


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IdOut(Out):
    id: int


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(Out):
    id: int
    email: str
    full_name: str
    role: str
    therapist_id: Optional[int]


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ParalysisOut(Out):
    id: int
    patient_id: int
    pressed_at: datetime
    description: Optional[str]
    seen_by_therapist: bool


class DescriptionIn(BaseModel):
    description: Optional[str] = None


class FeedbackIn(BaseModel):
    value: Optional[Literal["like", "dislike"]]


class EmotionIn(BaseModel):
    emotion_key: str

    @field_validator("emotion_key")
    @classmethod
    def known_emotion(cls, v: str) -> str:
        if v not in EMOTION_KEYS:
            raise ValueError("Emoción desconocida")
        return v


class EmotionCount(BaseModel):
    emotion_key: str
    count: int


class KpisOut(BaseModel):
    paralysis_count: int
    last_paralysis_at: Optional[datetime]
    emotion_count: int
    top_emotion: Optional[str]
    tasks_liked: int
    tasks_disliked: int


class TaskIn(BaseModel):
    title: str = Field(min_length=1)
    steps: list[Annotated[str, Field(min_length=1)]] = Field(min_length=1)


class TaskOut(Out):
    id: int
    patient_id: int
    title: str
    position: int
    feedback: Optional[str]
    feedback_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    steps: list[str]


class TipIn(BaseModel):
    title: str = Field(min_length=1)
    body: str = Field(min_length=1)
    position: Optional[int] = None  # only on PUT, to move a tip up/down


class TipOut(Out):
    id: int
    patient_id: int
    title: str
    body: str
    position: int


class PatientItem(BaseModel):
    id: int
    full_name: str
    email: str
    last_paralysis_at: Optional[datetime]
    unseen_count: int


class NotificationOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    pressed_at: datetime
    description: Optional[str]


def task_out(session: Session, task: Task) -> TaskOut:
    steps = session.exec(
        select(MicroStep.text).where(MicroStep.task_id == task.id).order_by(MicroStep.position)
    ).all()
    return TaskOut(**task.model_dump(), steps=list(steps))
