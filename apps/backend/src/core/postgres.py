"""PostgreSQL connection management."""
import asyncpg
from typing import Optional


class PostgresConnection:
    """PostgreSQL connection manager."""

    _pool: Optional[asyncpg.Pool] = None

    @classmethod
    async def init(cls, database_url: str) -> None:
        """Initialize connection pool."""
        # Parse the URL to extract connection parameters
        # URL format: postgresql+asyncpg://user:password@host:port/database
        from urllib.parse import urlparse

        parsed = urlparse(database_url)
        
        # Extract path without leading slash
        database = parsed.path.lstrip("/")
        
        cls._pool = await asyncpg.create_pool(
            user=parsed.username or "user",
            password=parsed.password or "password",
            database=database or "total_recall",
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            min_size=5,
            max_size=20,
        )

    @classmethod
    async def close(cls) -> None:
        """Close connection pool."""
        if cls._pool:
            await cls._pool.close()

    @classmethod
    def get_pool(cls) -> asyncpg.Pool:
        """Get connection pool."""
        if not cls._pool:
            raise RuntimeError("Database not initialized. Call init() first.")
        return cls._pool

    @classmethod
    async def execute(cls, query: str, *args):
        """Execute a query."""
        async with cls._pool.acquire() as connection:
            return await connection.execute(query, *args)

    @classmethod
    async def fetch_row(cls, query: str, *args):
        """Fetch a single row."""
        async with cls._pool.acquire() as connection:
            return await connection.fetchrow(query, *args)

    @classmethod
    async def fetch_all(cls, query: str, *args):
        """Fetch all rows."""
        async with cls._pool.acquire() as connection:
            return await connection.fetch(query, *args)
