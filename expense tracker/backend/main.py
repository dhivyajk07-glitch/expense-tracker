from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def connect_db():
    conn = sqlite3.connect("expenses.db")
    conn.row_factory = sqlite3.Row
    return conn

with connect_db() as conn:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL
        )
    """)

class Transaction(BaseModel):
    description: str
    amount: float
    type: str
    category: str
    date: str

@app.get("/")
def home():
    return {"message": "Expense Tracker API is running"}

@app.get("/transactions")
def get_transactions():
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY id DESC"
        ).fetchall()
        return [dict(row) for row in rows]

@app.post("/transactions")
def add_transaction(item: Transaction):
    if item.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if item.type not in ["income", "expense"]:
        raise HTTPException(400, "Invalid transaction type")

    with connect_db() as conn:
        cursor = conn.execute(
            """INSERT INTO transactions
            (description, amount, type, category, date)
            VALUES (?, ?, ?, ?, ?)""",
            (item.description, item.amount, item.type,
             item.category, item.date)
        )
        return {"id": cursor.lastrowid, "message": "Transaction added"}

@app.delete("/transactions/{item_id}")
def delete_transaction(item_id: int):
    with connect_db() as conn:
        cursor = conn.execute(
            "DELETE FROM transactions WHERE id = ?", (item_id,)
        )
        if cursor.rowcount == 0:
            raise HTTPException(404, "Transaction not found")
        return {"message": "Transaction deleted"}