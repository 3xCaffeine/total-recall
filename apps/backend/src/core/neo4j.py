"""Neo4j connection management."""
from neo4j import BoltDriver, Session, ManagedTransaction, GraphDatabase
from typing import Optional, List, Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor


class Neo4jConnection:
    """Neo4j connection manager."""

    _driver: Optional[BoltDriver] = None
    _executor: Optional[ThreadPoolExecutor] = None

    @classmethod
    async def init(cls, uri: str, user: str, password: str) -> None:
        """Initialize Neo4j driver."""
        cls._driver = GraphDatabase.driver(uri, auth=(user, password))
        cls._executor = ThreadPoolExecutor(max_workers=10)
        # Test connection
        await cls._run_in_executor(lambda: cls._driver.verify_connectivity())

    @classmethod
    async def close(cls) -> None:
        """Close Neo4j driver."""
        if cls._driver:
            await cls._run_in_executor(lambda: cls._driver.close())
        if cls._executor:
            cls._executor.shutdown(wait=True)

    @classmethod
    def get_driver(cls) -> BoltDriver:
        """Get Neo4j driver."""
        if not cls._driver:
            raise RuntimeError("Neo4j not initialized. Call init() first.")
        return cls._driver

    @classmethod
    async def _run_in_executor(cls, func):
        """Run a function in thread executor for async compatibility."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(cls._executor, func)

    @classmethod
    async def run_query(cls, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """Run a Cypher query and return results."""
        if parameters is None:
            parameters = {}

        def execute():
            with cls._driver.session() as session:
                result = session.run(query, parameters)
                return result.data()

        return await cls._run_in_executor(execute)

    @classmethod
    async def merge_node(
        cls, label: str, properties: Dict[str, Any], user_id: str
    ) -> None:
        """Merge a node (create or update)."""
        query = f"""
        MERGE (n:{label} {{id: $id, user_id: $user_id}})
        SET n += $properties
        """
        properties_with_user = {**properties, "user_id": user_id}
        await cls.run_query(
            query,
            {"id": properties.get("id"), "user_id": user_id, "properties": properties_with_user},
        )

    @classmethod
    async def create_relationship(
        cls,
        start_label: str,
        start_id: str,
        rel_type: str,
        end_label: str,
        end_id: str,
        user_id: str,
    ) -> None:
        """Create a relationship between two nodes."""
        query = f"""
        MATCH (a:{start_label} {{id: $start_id, user_id: $user_id}})
        MATCH (b:{end_label} {{id: $end_id, user_id: $user_id}})
        MERGE (a)-[:{rel_type}]->(b)
        """
        await cls.run_query(
            query,
            {
                "start_id": start_id,
                "end_id": end_id,
                "user_id": user_id,
            },
        )

    @classmethod
    async def get_node_neighbors(cls, node_id: str, user_id: str, depth: int = 1) -> Dict:
        """Get node and its neighbors."""
        query = """
        MATCH (n {id: $node_id, user_id: $user_id})
        OPTIONAL MATCH (n)-[*1..depth]-(neighbor)
        RETURN n as node, collect(neighbor) as neighbors
        """
        result = await cls.run_query(
            query, {"node_id": node_id, "user_id": user_id, "depth": depth}
        )
        return result[0] if result else {}
