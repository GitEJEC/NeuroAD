from sqlmodel import Session, SQLModel, create_engine

from app.config import DB_URL

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})


def create_db() -> None:
    from app import models  # noqa: F401  registers tables in SQLModel.metadata

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
