from typing import Any, Dict, List

from pydantic import BaseModel


class GraphNodeSchema(BaseModel):
    id: str
    type: str
    label: str
    metadata: Dict[str, Any]


class GraphEdgeSchema(BaseModel):
    source: str
    target: str
    type: str
    properties: Dict[str, Any]


class GraphResponse(BaseModel):
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]
