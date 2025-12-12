"""
Modelos do User Service

"""
import enum
from sqlalchemy import Column, Integer, String
# Removi imports não usados (DateTime, Boolean, ForeignKey, relationship) para limpar
from app.database import Base


class UserRole(str, enum.Enum):
    """Roles de usuário"""
    ADMIN = "admin"
    COMUM = "comum"


class User(Base):
    """Modelo de usuário"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.COMUM.value, nullable=False)
    

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"