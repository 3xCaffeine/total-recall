from cosdata import Client
from .config import get_settings

_collection = None

def get_collection():
    global _collection
    if _collection is None:
        print("DEBUG: Initializing Cosdata Client")
        settings = get_settings()
        print(f"DEBUG: Cosdata settings - Host: {settings.cosdata_host}, Username: {settings.cosdata_username}, Password: {settings.cosdata_password}, Collection: {settings.cosdata_collection_name}")
        client = Client(
            host=settings.cosdata_host,
            username=settings.cosdata_username,
            password="admin",
            verify=False
        )
        print("DEBUG: Client initialized successfully")
        try:
            print("DEBUG: Attempting to get collection")
            collection = client.get_collection(settings.cosdata_collection_name)
            print("DEBUG: Collection retrieved")
        except Exception as e:
            print(f"DEBUG: Collection not found, creating new one. Error: {e}")
            collection = client.create_collection(
                name=settings.cosdata_collection_name,
                dimension=768,
                description="vector collection"
            )
            print("DEBUG: Collection created")
        try:
            print("DEBUG: Attempting to create index")
            collection.create_index(
                distance_metric="cosine",
                num_layers=10,
                max_cache_size=1000,
                ef_construction=128,
                ef_search=64,
                neighbors_count=32,
                level_0_neighbors_count=64
            )
            print("DEBUG: Index created")
        except Exception as e:
            print(f"DEBUG: Index creation failed or already exists. Error: {e}")
        _collection = collection
    return _collection