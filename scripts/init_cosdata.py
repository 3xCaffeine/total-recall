#!/usr/bin/env python3
"""Initialize Cosdata collections."""
import httpx
import asyncio
import sys

async def init_cosdata():
    """Create journal_entries collection in Cosdata."""
    base_url = "http://localhost:8443"
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Create collection
        collection_url = f"{base_url}/api/v1/vectordb/collections"
        
        print("Creating 'journal_entries' collection in Cosdata...")
        response = await client.post(
            collection_url,
            json={
                "id": "journal_entries",
                "vector_size": 768,  # Matches text-embedding-004 model
                "compression": "none",
                "replication_factor": 1,
            }
        )
        
        if response.status_code in (200, 201):
            print(f"✓ Collection created successfully: {response.json()}")
            return True
        elif response.status_code == 409:
            print("✓ Collection already exists")
            return True
        else:
            print(f"✗ Failed to create collection: {response.status_code}")
            print(f"Response: {response.text}")
            return False


if __name__ == "__main__":
    try:
        success = asyncio.run(init_cosdata())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
