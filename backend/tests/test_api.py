from datetime import timedelta

from sqlmodel import select

from app.models import EmotionLog, User, utcnow
from app.security import hash_password

THERAPIST = "terapeuta@neuroad.cl"
P1 = "paciente1@neuroad.cl"
P2 = "paciente2@neuroad.cl"


def user_id(session, email: str) -> int:
    return session.exec(select(User).where(User.email == email)).one().id


def test_login_ok_and_wrong_password(client):
    r = client.post("/auth/login", json={"email": THERAPIST, "password": "demo1234"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "therapist"
    token = r.json()["access_token"]
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).json()["email"] == THERAPIST

    assert client.post("/auth/login", json={"email": THERAPIST, "password": "mala"}).status_code == 401
    assert client.get("/auth/me").status_code == 401


def test_patient_cannot_use_therapist_endpoints(client, auth):
    h = auth(P1)
    assert client.get("/patients", headers=h).status_code == 403
    assert client.get("/notifications", headers=h).status_code == 403
    assert client.get("/me/tasks", headers=auth(THERAPIST)).status_code == 403


def test_therapist_cannot_see_other_patients(client, auth, session):
    session.add(User(email="otro@neuroad.cl", password_hash=hash_password("x"),
                     full_name="Otro Terapeuta", role="therapist"))
    session.commit()
    h = auth("otro@neuroad.cl", "x")
    p1 = user_id(session, P1)

    assert client.get("/patients", headers=h).json() == []
    assert client.get("/notifications", headers=h).json() == []
    for path in (f"/patients/{p1}", f"/patients/{p1}/kpis", f"/patients/{p1}/tasks",
                 f"/patients/{p1}/emotions/summary"):
        assert client.get(path, headers=h).status_code == 404, path
    assert len(client.get("/patients", headers=auth(THERAPIST)).json()) == 2


def test_paralysis_flow(client, auth):
    hp, ht = auth(P1), auth(THERAPIST)
    before = len(client.get("/notifications", headers=ht).json())

    r = client.post("/me/paralysis", headers=hp)
    assert r.status_code == 201
    rid = r.json()["id"]
    r = client.patch(f"/me/paralysis/{rid}", json={"description": "No pude partir"}, headers=hp)
    assert r.json()["description"] == "No pude partir"

    notes = client.get("/notifications", headers=ht).json()
    assert len(notes) == before + 1
    assert notes[0]["id"] == rid and notes[0]["patient_name"] == "Matías Soto"
    assert notes[0]["pressed_at"].endswith("Z")

    assert client.patch(f"/paralysis/{rid}/seen", headers=ht).json()["seen_by_therapist"] is True
    assert rid not in [n["id"] for n in client.get("/notifications", headers=ht).json()]


def test_emotion_summary_by_range(client, auth, session):
    p2 = user_id(session, P2)
    now = utcnow()
    for ago, key in ((timedelta(0), "calma"), (timedelta(days=3), "calma"),
                     (timedelta(days=20), "enojo"), (timedelta(days=40), "miedo")):
        session.add(EmotionLog(patient_id=p2, emotion_key=key, created_at=now - ago))
    session.commit()
    h = auth(THERAPIST)

    def summary(r):
        return client.get(f"/patients/{p2}/emotions/summary?range={r}", headers=h).json()

    assert summary("day") == [{"emotion_key": "calma", "count": 1}]
    assert summary("week") == [{"emotion_key": "calma", "count": 2}]
    assert summary("month") == [{"emotion_key": "calma", "count": 2},
                                {"emotion_key": "enojo", "count": 1}]
    kpis = client.get(f"/patients/{p2}/kpis?range=month", headers=h).json()
    assert kpis["emotion_count"] == 3 and kpis["top_emotion"] == "calma"
    kpis = client.get(f"/patients/{user_id(session, P1)}/kpis?range=month", headers=h).json()
    assert kpis["last_paralysis_at"].endswith("Z")
    assert client.get(f"/patients/{p2}/emotions/summary?range=year", headers=h).status_code == 422


def test_put_task_replaces_steps(client, auth, session):
    p1 = user_id(session, P1)
    h = auth(THERAPIST)
    task = client.post(f"/patients/{p1}/tasks", json={"title": "Lavar", "steps": ["a", "b", "c"]},
                       headers=h).json()
    assert task["steps"] == ["a", "b", "c"] and task["position"] == 3

    r = client.put(f"/patients/{p1}/tasks/{task['id']}", json={"title": "Lavar loza", "steps": ["c", "a"]},
                   headers=h)
    assert r.json()["title"] == "Lavar loza" and r.json()["steps"] == ["c", "a"]
    mine = [t for t in client.get("/me/tasks", headers=auth(P1)).json() if t["id"] == task["id"]]
    assert mine[0]["steps"] == ["c", "a"]

    bad = client.put(f"/patients/{p1}/tasks/{task['id']}", json={"title": "x", "steps": []}, headers=h)
    assert bad.status_code == 422


def test_task_feedback_toggle(client, auth, session):
    h = auth(P1)
    tid = client.get("/me/tasks", headers=h).json()[0]["id"]
    assert client.put(f"/me/tasks/{tid}/feedback", json={"value": "like"}, headers=h).json()["feedback"] == "like"
    p1 = user_id(session, P1)
    kpis = client.get(f"/patients/{p1}/kpis?range=day", headers=auth(THERAPIST)).json()
    assert kpis["tasks_liked"] == 1
    r = client.put(f"/me/tasks/{tid}/feedback", json={"value": None}, headers=h).json()
    assert r["feedback"] is None and r["feedback_at"] is None


def test_emotion_undo_window(client, auth, session):
    h = auth(P1)
    eid = client.post("/me/emotions", json={"emotion_key": "calma"}, headers=h).json()["id"]
    assert client.delete(f"/me/emotions/{eid}", headers=h).status_code == 204

    eid = client.post("/me/emotions", json={"emotion_key": "calma"}, headers=h).json()["id"]
    log = session.get(EmotionLog, eid)
    log.created_at = utcnow() - timedelta(minutes=3)
    session.add(log)
    session.commit()
    assert client.delete(f"/me/emotions/{eid}", headers=h).status_code == 409
    assert client.post("/me/emotions", json={"emotion_key": "felicidad"}, headers=h).status_code == 422
