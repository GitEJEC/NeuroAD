"""Drop and recreate the database with fictional demo data. Safe to run many times."""
import random
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, SQLModel

from app.db import engine
from app.emotions import EMOTION_KEYS
from app.models import EmotionLog, MicroStep, ParalysisReport, Task, Tip, User
from app.security import hash_password

DEMO_PASSWORD = "demo1234"

DEFAULT_TIPS = [
    (
        "Baja la vara y achica el paso",
        "Elige solo una cosa mínima (por ejemplo, abrir el documento o escribir una línea). "
        "No intentes resolver todo el pendiente de golpe.",
    ),
    (
        "Usa un temporizador corto",
        "Pon 5 o 10 minutos con la idea de parar si quieres cuando suene. "
        "Empezar suele destrabar la inercia.",
    ),
    (
        "Cambia tu estado físico",
        "Levántate, toma agua, estírate o sal un par de minutos a que te dé el aire. "
        "Mover el cuerpo ayuda a cortar el bucle mental.",
    ),
    (
        "Baja la culpa",
        "Criticarte o retarte por estar bloqueado suele aumentar la ansiedad y empeorar la parálisis.",
    ),
    (
        "Pide body doubling",
        "Trabajar o hacer algo simple junto a otra persona (en persona o en llamada) "
        "puede dar un empujón suave para arrancar.",
    ),
]

TASKS = [
    (
        "Hacer la cama",
        [
            "Quitar todo lo que esté encima de la cama.",
            "Ajusta la base: coloca el protector de colchón (si usas) y encima la sábana bajera, "
            "enganchando bien las cuatro esquinas para que quede tirante y sin arrugas.",
            "Extiende la sábana encimera: pon la sábana plana encima con el lado bonito "
            "(o el bordado superior) mirando hacia abajo. Déjala al ras del borde de la cabecera "
            "y mete el sobrante de los pies debajo del colchón.",
            "Coloca la frazada: extiéndela sobre la sábana encimera, dejándola unos 20 a 30 cm "
            "más abajo que el borde de la cabecera. Mete los bordes inferiores y laterales "
            "debajo del colchón para que quede firme.",
            "Haz el doblez superior: toma el borde superior de la sábana encimera y dóblalo hacia "
            "atrás sobre la frazada (protege la frazada y da un acabado limpio tipo hotel).",
            "Cubre y remata: extiende el cubrecama por encima de todo cubriendo los costados "
            "y acomoda las almohadas con sus fundas al final.",
        ],
    ),
    (
        "Preparar la mochila para mañana",
        [
            "Saca de la mochila todo lo que no vas a usar mañana.",
            "Revisa tu horario de mañana.",
            "Guarda los cuadernos y materiales de cada clase.",
            "Deja la mochila junto a la puerta.",
        ],
    ),
    (
        "Responder un correo pendiente",
        [
            "Abre el correo que tienes pendiente.",
            "Escribe una sola frase con lo principal.",
            "Agrega un saludo y una despedida.",
            "Presiona Enviar.",
        ],
    ),
]

# (days_ago, description, seen_by_therapist)
PARALYSIS = [
    (25, "No pude empezar a estudiar para la prueba.", True),
    (18, None, True),
    (9, "Me bloqueé al ver todos los correos sin leer.", True),
    (3, None, False),
    (0, "Quería ordenar mi pieza y no supe por dónde partir.", False),
]


def seed(eng=engine) -> None:
    random.seed(42)  # reproducible demo data
    SQLModel.metadata.drop_all(eng)
    SQLModel.metadata.create_all(eng)
    now = datetime.now(timezone.utc)
    pw = hash_password(DEMO_PASSWORD)

    with Session(eng) as s:
        therapist = User(email="terapeuta@neuroad.cl", password_hash=pw,
                         full_name="Camila Rojas", role="therapist")
        s.add(therapist)
        s.commit()

        p1 = User(email="paciente1@neuroad.cl", password_hash=pw, full_name="Matías Soto",
                  role="patient", therapist_id=therapist.id)
        p2 = User(email="paciente2@neuroad.cl", password_hash=pw, full_name="Valentina Muñoz",
                  role="patient", therapist_id=therapist.id)
        s.add_all([p1, p2])
        s.commit()

        for patient in (p1, p2):
            for i, (title, body) in enumerate(DEFAULT_TIPS):
                s.add(Tip(patient_id=patient.id, title=title, body=body, position=i))

        keys = sorted(EMOTION_KEYS)
        for _ in range(40):
            ago = timedelta(days=random.randint(0, 29), hours=random.randint(0, 23),
                            minutes=random.randint(0, 59))
            s.add(EmotionLog(patient_id=p1.id, emotion_key=random.choice(keys),
                             created_at=now - ago))

        for days_ago, description, seen in PARALYSIS:
            s.add(ParalysisReport(patient_id=p1.id, description=description, seen_by_therapist=seen,
                                  pressed_at=now - timedelta(days=days_ago, hours=1)))

        for i, (title, steps) in enumerate(TASKS):
            task = Task(patient_id=p1.id, title=title, position=i)
            s.add(task)
            s.commit()
            for j, text in enumerate(steps):
                s.add(MicroStep(task_id=task.id, position=j, text=text))

        s.commit()

    print("Base de datos creada con datos demo.")
    print(f"  Terapeuta: terapeuta@neuroad.cl / {DEMO_PASSWORD}")
    print(f"  Pacientes: paciente1@neuroad.cl, paciente2@neuroad.cl / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed()
