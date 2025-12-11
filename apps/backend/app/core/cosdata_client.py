from cosdata import Client
from .config import get_settings

_collection = None

def get_collection():
    global _collection
    if _collection is None:
        settings = get_settings()
        client = Client(
            host=settings.cosdata_host,
            username=settings.cosdata_username,
            password=settings.cosdata_password,
            verify=False
        )
        try:
            collection = client.get_collection(settings.cosdata_collection_name)
        except Exception:
            collection = client.create_collection(
                name=settings.cosdata_collection_name,
                dimension=768,
                description="vector collection"
            )
        try:
            collection.create_index(
                distance_metric="cosine",
                num_layers=10,
                max_cache_size=1000,
                ef_construction=128,
                ef_search=64,
                neighbors_count=32,
                level_0_neighbors_count=64
            )
        except Exception:
            pass
        _collection = collection
    return _collection