from enum import Enum

class DifficultyMultiplier(float, Enum):
    """Multiplicadores de pontuação baseados na dificuldade"""
    EASY = 1.0
    MEDIUM = 1.5
    HARD = 2.0

def calculate_points(
    is_correct: bool, 
    time_taken_seconds: float, 
    difficulty: str = "medium",
    max_time_allowed: int = 30
) -> int:
    """
    Calcula pontuação considerando acerto, tempo e dificuldade.
    
    Args:
        is_correct: Se a resposta está certa
        time_taken_seconds: Tempo levado (pode ser float, ex: 5.4s)
        difficulty: 'easy', 'medium' ou 'hard'
        max_time_allowed: Tempo máximo da pergunta (para cálculo do bônus)
    """
    if not is_correct:
        return 0

    # 1. Definições Base
    BASE_POINTS = 100
    
    # 2. Sanitização de Input (Segurança contra cheat de tempo negativo)
    # Garante que o tempo nunca seja menor que 0
    safe_time = max(0.0, float(time_taken_seconds))
    
    # 3. Cálculo do Bônus de Velocidade
    # Fórmula: (Tempo Máximo - Tempo Gasto) * 2
    # Se demorou mais que o máximo, bônus é 0
    time_bonus = max(0.0, (max_time_allowed - safe_time) * 2)
    
    # 4. Cálculo com Dificuldade
    raw_score = BASE_POINTS + time_bonus
    
    try:
        multiplier = DifficultyMultiplier[difficulty.upper()].value
    except KeyError:
        multiplier = 1.0 

    final_score = int(raw_score * multiplier)
    
    return final_score