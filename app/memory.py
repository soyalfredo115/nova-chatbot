# Memoria simple en proceso: diccionario por session_id
# Para demo local. En producción, usar Redis/DB.
from collections import defaultdict
from typing import List, Dict
from .schemas import Message

_memory: Dict[str, List[Message]] = defaultdict(list)


def get_history(session_id: str) -> List[Message]:
    return _memory[session_id]


def add_to_history(session_id: str, msg: Message) -> None:
    _memory[session_id].append(msg)


def reset_history(session_id: str) -> None:
    _memory[session_id].clear()

