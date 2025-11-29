"""PostgreSQL schema initialization script."""
import asyncio
import asyncpg
from typing import Optional


async def init_database(
    user: str = "user",
    password: str = "password",
    host: str = "localhost",
    port: int = 5432,
    database: str = "total_recall",
):
    """Initialize PostgreSQL database schema."""
    
    # Connect to PostgreSQL
    conn = await asyncpg.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=database,
    )

    try:
        # Create tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("✓ Created users table")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                source VARCHAR(50) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("✓ Created entries table")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(20) DEFAULT 'medium',
                due_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("✓ Created tasks table")

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        print("✓ Created sessions table")

        # Create indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)")
        print("✓ Created indexes")

        print("\n✅ Database schema initialized successfully!")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    # Parse command line arguments if needed
    import sys
    
    kwargs = {
        "user": "user",
        "password": "password",
        "host": "localhost",
        "port": 5432,
        "database": "total_recall",
    }
    
    # Allow overrides from environment or CLI
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if "=" in arg:
                key, value = arg.split("=")
                if key in kwargs:
                    kwargs[key] = int(value) if key == "port" else value
    
    asyncio.run(init_database(**kwargs))
