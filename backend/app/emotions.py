# Single source of truth for the emotion catalog. Frontends read it from GET /emotions.
EMOTIONS = [
    {"key": "alegria", "label": "Alegría", "emoji": "😊", "color": "#F2B705"},
    {"key": "calma", "label": "Calma", "emoji": "😌", "color": "#4CAF93"},
    {"key": "tristeza", "label": "Tristeza", "emoji": "😢", "color": "#4A78C2"},
    {"key": "miedo", "label": "Miedo", "emoji": "😨", "color": "#7E57C2"},
    {"key": "enojo", "label": "Enojo", "emoji": "😠", "color": "#D9534F"},
    {"key": "asco", "label": "Asco", "emoji": "🤢", "color": "#6B8E23"},
    {"key": "sorpresa", "label": "Sorpresa", "emoji": "😮", "color": "#F28C28"},
    {"key": "ansiedad", "label": "Ansiedad", "emoji": "😰", "color": "#E06C9F"},
    {"key": "envidia", "label": "Envidia", "emoji": "😒", "color": "#2E8B57"},
    {"key": "frustracion", "label": "Frustración", "emoji": "😤", "color": "#8D6E63"},
]

EMOTION_KEYS = {e["key"] for e in EMOTIONS}
