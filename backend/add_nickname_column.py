"""Add nickname column to devices table"""
import asyncio
from sqlalchemy import text
from app.database import engine

async def add_nickname_column():
    async with engine.begin() as conn:
        # Check if column exists (SQLite specific)
        result = await conn.execute(text("""
            PRAGMA table_info(devices)
        """))

        columns = [row[1] for row in result.fetchall()]

        if 'nickname' not in columns:
            print("Adding nickname column...")
            await conn.execute(text("""
                ALTER TABLE devices
                ADD COLUMN nickname VARCHAR(50)
            """))
            print("✓ Nickname column added successfully!")
        else:
            print("✓ Nickname column already exists")

if __name__ == "__main__":
    asyncio.run(add_nickname_column())
