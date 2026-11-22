from datetime import datetime, timedelta, timezone
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, delete, func, select

from app.db import get_session
from app.models import EmotionLog, MicroStep, ParalysisReport, Task, Tip, User, utcnow
from app.schemas import (EmotionCount, KpisOut, NotificationOut, ParalysisOut, PatientItem, Range,
                         TaskIn, TaskOut, TipIn, TipOut, UserOut, task_out)
from app.routers.patient import own
from app.security import require_therapist

router = APIRouter(tags=["terapeuta"])

SANTIAGO = ZoneInfo("America/Santiago")
RangeParam = Annotated[Range, Query(alias="range")]


def range_start(r: str) -> datetime:
    if r == "day":
        start = datetime.now(SANTIAGO).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start = utcnow() - timedelta(days=7 if r == "week" else 30)
    return start.astimezone(timezone.utc)


def own_patient(session: Session, therapist: User, patient_id: int) -> User:
    patient = session.get(User, patient_id)
    if patient is None or patient.role != "patient" or patient.therapist_id != therapist.id:
        raise HTTPException(404, "Paciente no encontrado")
    return patient


def next_position(session: Session, model, patient_id: int) -> int:
    top = session.exec(select(func.max(model.position)).where(model.patient_id == patient_id)).one()
    return 0 if top is None else top + 1


def emotion_counts(session: Session, patient_id: int, start: datetime) -> list[EmotionCount]:
    rows = session.exec(
        select(EmotionLog.emotion_key, func.count())
        .where(EmotionLog.patient_id == patient_id, EmotionLog.created_at >= start)
        .group_by(EmotionLog.emotion_key)
        .order_by(func.count().desc(), EmotionLog.emotion_key)
    ).all()
    return [EmotionCount(emotion_key=k, count=c) for k, c in rows]


# --- Patients ---

@router.get("/patients", response_model=list[PatientItem])
def list_patients(therapist: User = Depends(require_therapist),
                  session: Session = Depends(get_session)):
    patients = session.exec(
        select(User).where(User.therapist_id == therapist.id, User.role == "patient")
        .order_by(User.full_name)
    ).all()
    items = []
    for p in patients:  # shortcut: one query per patient, fine for a handful of patients
        last, unseen = session.exec(
            select(func.max(ParalysisReport.pressed_at),
                   func.count().filter(ParalysisReport.seen_by_therapist == False))  # noqa: E712
            .where(ParalysisReport.patient_id == p.id)
        ).one()
        items.append(PatientItem(id=p.id, full_name=p.full_name, email=p.email,
                                 last_paralysis_at=last, unseen_count=unseen))
    return items


@router.get("/patients/{patient_id}", response_model=UserOut)
def get_patient(patient_id: int, therapist: User = Depends(require_therapist),
                session: Session = Depends(get_session)):
    return own_patient(session, therapist, patient_id)


@router.get("/patients/{patient_id}/emotions/summary", response_model=list[EmotionCount])
def emotions_summary(patient_id: int, range_: RangeParam = "week",
                     therapist: User = Depends(require_therapist),
                     session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    return emotion_counts(session, patient_id, range_start(range_))


@router.get("/patients/{patient_id}/kpis", response_model=KpisOut)
def kpis(patient_id: int, range_: RangeParam = "week",
         therapist: User = Depends(require_therapist), session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    start = range_start(range_)
    paralysis_count, last = session.exec(
        select(func.count(), func.max(ParalysisReport.pressed_at))
        .where(ParalysisReport.patient_id == patient_id, ParalysisReport.pressed_at >= start)
    ).one()
    counts = emotion_counts(session, patient_id, start)

    def feedback_count(value: str) -> int:
        return session.exec(
            select(func.count()).select_from(Task)
            .where(Task.patient_id == patient_id, Task.feedback == value, Task.feedback_at >= start)
        ).one()

    return KpisOut(
        paralysis_count=paralysis_count,
        last_paralysis_at=last,
        emotion_count=sum(c.count for c in counts),
        top_emotion=counts[0].emotion_key if counts else None,
        tasks_liked=feedback_count("like"),
        tasks_disliked=feedback_count("dislike"),
    )


@router.get("/patients/{patient_id}/paralysis", response_model=list[ParalysisOut])
def patient_paralysis(patient_id: int,
                      range_: Annotated[Range | None, Query(alias="range")] = None,
                      therapist: User = Depends(require_therapist),
                      session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    query = select(ParalysisReport).where(ParalysisReport.patient_id == patient_id)
    if range_ is not None:  # no range = full history (the web's paralysis log)
        query = query.where(ParalysisReport.pressed_at >= range_start(range_))
    return session.exec(query.order_by(ParalysisReport.pressed_at.desc())).all()


# --- Notifications ---

@router.get("/notifications", response_model=list[NotificationOut])
def notifications(therapist: User = Depends(require_therapist),
                  session: Session = Depends(get_session)):
    rows = session.exec(
        select(ParalysisReport, User.full_name)
        .join(User, User.id == ParalysisReport.patient_id)
        .where(User.therapist_id == therapist.id, ParalysisReport.seen_by_therapist == False)  # noqa: E712
        .order_by(ParalysisReport.pressed_at.desc())
    ).all()
    return [NotificationOut(id=r.id, patient_id=r.patient_id, patient_name=name,
                            pressed_at=r.pressed_at, description=r.description)
            for r, name in rows]


@router.patch("/paralysis/{report_id}/seen", response_model=ParalysisOut)
def mark_seen(report_id: int, therapist: User = Depends(require_therapist),
              session: Session = Depends(get_session)):
    report = session.get(ParalysisReport, report_id)
    if report is None:
        raise HTTPException(404, "No encontrado")
    own_patient(session, therapist, report.patient_id)
    report.seen_by_therapist = True
    session.add(report)
    session.commit()
    session.refresh(report)
    return report


# --- Tasks ---

def save_steps(session: Session, task_id: int, steps: list[str]) -> None:
    for i, text in enumerate(steps):
        session.add(MicroStep(task_id=task_id, position=i, text=text.strip()))


@router.get("/patients/{patient_id}/tasks", response_model=list[TaskOut])
def list_tasks(patient_id: int, therapist: User = Depends(require_therapist),
               session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    tasks = session.exec(select(Task).where(Task.patient_id == patient_id).order_by(Task.position))
    return [task_out(session, t) for t in tasks.all()]


@router.post("/patients/{patient_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(patient_id: int, data: TaskIn, therapist: User = Depends(require_therapist),
                session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    task = Task(patient_id=patient_id, title=data.title.strip(),
                position=next_position(session, Task, patient_id))
    session.add(task)
    session.flush()
    save_steps(session, task.id, data.steps)
    session.commit()
    session.refresh(task)
    return task_out(session, task)


@router.put("/patients/{patient_id}/tasks/{task_id}", response_model=TaskOut)
def update_task(patient_id: int, task_id: int, data: TaskIn,
                therapist: User = Depends(require_therapist),
                session: Session = Depends(get_session)):
    task = own(session, Task, task_id, own_patient(session, therapist, patient_id))
    task.title = data.title.strip()
    task.updated_at = utcnow()
    session.exec(delete(MicroStep).where(MicroStep.task_id == task.id))
    save_steps(session, task.id, data.steps)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task_out(session, task)


@router.delete("/patients/{patient_id}/tasks/{task_id}", status_code=204)
def delete_task(patient_id: int, task_id: int, therapist: User = Depends(require_therapist),
                session: Session = Depends(get_session)):
    task = own(session, Task, task_id, own_patient(session, therapist, patient_id))
    session.exec(delete(MicroStep).where(MicroStep.task_id == task.id))
    session.delete(task)
    session.commit()


# --- Tips ---

@router.get("/patients/{patient_id}/tips", response_model=list[TipOut])
def list_tips(patient_id: int, therapist: User = Depends(require_therapist),
              session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    return session.exec(select(Tip).where(Tip.patient_id == patient_id).order_by(Tip.position)).all()


@router.post("/patients/{patient_id}/tips", response_model=TipOut, status_code=201)
def create_tip(patient_id: int, data: TipIn, therapist: User = Depends(require_therapist),
               session: Session = Depends(get_session)):
    own_patient(session, therapist, patient_id)
    tip = Tip(patient_id=patient_id, title=data.title.strip(), body=data.body.strip(),
              position=next_position(session, Tip, patient_id))
    session.add(tip)
    session.commit()
    session.refresh(tip)
    return tip


@router.put("/patients/{patient_id}/tips/{tip_id}", response_model=TipOut)
def update_tip(patient_id: int, tip_id: int, data: TipIn,
               therapist: User = Depends(require_therapist),
               session: Session = Depends(get_session)):
    tip = own(session, Tip, tip_id, own_patient(session, therapist, patient_id))
    tip.title = data.title.strip()
    tip.body = data.body.strip()
    if data.position is not None:
        tip.position = data.position
    session.add(tip)
    session.commit()
    session.refresh(tip)
    return tip


@router.delete("/patients/{patient_id}/tips/{tip_id}", status_code=204)
def delete_tip(patient_id: int, tip_id: int, therapist: User = Depends(require_therapist),
               session: Session = Depends(get_session)):
    tip = own(session, Tip, tip_id, own_patient(session, therapist, patient_id))
    session.delete(tip)
    session.commit()
