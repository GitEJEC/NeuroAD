from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import EmotionLog, ParalysisReport, Task, Tip, User, utcnow
from app.schemas import (DescriptionIn, EmotionIn, FeedbackIn, IdOut, ParalysisOut, TaskOut,
                         TipOut, task_out)
from app.security import require_patient

router = APIRouter(prefix="/me", tags=["paciente"])

UNDO_WINDOW = timedelta(minutes=2)


def own(session: Session, model, item_id: int, patient: User):
    item = session.get(model, item_id)
    if item is None or item.patient_id != patient.id:
        raise HTTPException(404, "No encontrado")
    return item


@router.post("/paralysis", response_model=IdOut, status_code=201)
def report_paralysis(patient: User = Depends(require_patient),
                     session: Session = Depends(get_session)):
    report = ParalysisReport(patient_id=patient.id)
    session.add(report)
    session.commit()
    return report


@router.patch("/paralysis/{report_id}", response_model=ParalysisOut)
def describe_paralysis(report_id: int, data: DescriptionIn,
                       patient: User = Depends(require_patient),
                       session: Session = Depends(get_session)):
    report = own(session, ParalysisReport, report_id, patient)
    report.description = (data.description or "").strip() or None
    session.add(report)
    session.commit()
    session.refresh(report)
    return report


@router.get("/tasks", response_model=list[TaskOut])
def my_tasks(patient: User = Depends(require_patient), session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.patient_id == patient.id).order_by(Task.position))
    return [task_out(session, t) for t in tasks.all()]


@router.put("/tasks/{task_id}/feedback", response_model=TaskOut)
def task_feedback(task_id: int, data: FeedbackIn, patient: User = Depends(require_patient),
                  session: Session = Depends(get_session)):
    task = own(session, Task, task_id, patient)
    task.feedback = data.value
    task.feedback_at = utcnow() if data.value else None
    session.add(task)
    session.commit()
    session.refresh(task)
    return task_out(session, task)


@router.post("/emotions", response_model=IdOut, status_code=201)
def log_emotion(data: EmotionIn, patient: User = Depends(require_patient),
                session: Session = Depends(get_session)):
    log = EmotionLog(patient_id=patient.id, emotion_key=data.emotion_key)
    session.add(log)
    session.commit()
    return log


@router.delete("/emotions/{log_id}", status_code=204)
def undo_emotion(log_id: int, patient: User = Depends(require_patient),
                 session: Session = Depends(get_session)):
    log = own(session, EmotionLog, log_id, patient)
    if utcnow() - log.created_at > UNDO_WINDOW:
        raise HTTPException(409, "Ya no se puede deshacer este registro")
    session.delete(log)
    session.commit()


@router.get("/tips", response_model=list[TipOut])
def my_tips(patient: User = Depends(require_patient), session: Session = Depends(get_session)):
    return session.exec(select(Tip).where(Tip.patient_id == patient.id).order_by(Tip.position)).all()
