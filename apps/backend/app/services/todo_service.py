"""
Todo service for CRUD operations.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoUpdate


class TodoService:
    def __init__(self, db: Session):
        self.db = db

    def get_todos(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Todo]:
        return (
            self.db.query(Todo)
            .filter(Todo.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_todo(self, todo_id: int, user_id: str) -> Optional[Todo]:
        return (
            self.db.query(Todo)
            .filter(Todo.id == todo_id, Todo.user_id == user_id)
            .first()
        )

    def create_todo(self, user_id: str, todo: TodoCreate) -> Todo:
        db_todo = Todo(
            user_id=user_id,
            task=todo.task,
            priority=todo.priority,
            due_date=todo.due_date,
            journal_entry_id=todo.journal_entry_id,
        )
        self.db.add(db_todo)
        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def update_todo(self, todo_id: int, user_id: str, todo: TodoUpdate) -> Optional[Todo]:
        db_todo = self.get_todo(todo_id, user_id)
        if not db_todo:
            return None

        update_data = todo.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        for field, value in update_data.items():
            setattr(db_todo, field, value)

        self.db.commit()
        self.db.refresh(db_todo)
        return db_todo

    def delete_todo(self, todo_id: int, user_id: str) -> bool:
        db_todo = self.get_todo(todo_id, user_id)
        if not db_todo:
            return False

        self.db.delete(db_todo)
        self.db.commit()
        return True