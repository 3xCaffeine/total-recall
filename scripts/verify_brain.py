import asyncio
import os

import asyncpg
from neo4j import GraphDatabase
from dotenv import load_dotenv


def load_env():
    # Look for env in ../infra/.env
    env_path = os.path.join(os.path.dirname(__file__), "..", "infra", ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        print(f"Warning: .env not found at {env_path}, relying on process env.")


async def check_postgres():
    print("🔍 Checking Postgres...")
    user = os.getenv("POSTGRES_USER", "total_recall")
    password = os.getenv("POSTGRES_PASSWORD", "total_recall_password")
    db = os.getenv("POSTGRES_DB", "total_recall")
    port = os.getenv("POSTGRES_PORT", "5432")

    conn_str = f"postgres://{user}:{password}@localhost:{port}/{db}"

    try:
        conn = await asyncpg.connect(conn_str)
        await conn.execute("SELECT 1;")
        await conn.close()
        print("✅ Postgres OK")
    except Exception as e:
        print("❌ Postgres FAILED:", e)


def check_neo4j():
    print("🔍 Checking Neo4j...")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "neo4j_password")
    bolt_port = os.getenv("NEO4J_BOLT_PORT", "7687")

    uri = f"bolt://localhost:{bolt_port}"

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session() as session:
            session.run("RETURN 1").single()
        driver.close()
        print("✅ Neo4j OK")
    except Exception as e:
        print("❌ Neo4j FAILED:", e)


async def main():
    load_env()
    await check_postgres()
    check_neo4j()


if __name__ == "__main__":
    asyncio.run(main())
