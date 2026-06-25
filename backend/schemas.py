from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ── Collection ──────────────────────────────────────────────
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CollectionOut(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Saved Request ────────────────────────────────────────────
class SavedRequestCreate(BaseModel):
    collection_id: int
    name: str
    description: Optional[str] = ""
    method: str = "GET"
    url: str = ""
    headers: str = "[]"
    params: str = "[]"
    body_type: str = "none"
    body_content: str = ""
    body_raw_type: str = "JSON"
    auth_type: str = "none"
    auth_data: str = "{}"


class SavedRequestUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[str] = None
    params: Optional[str] = None
    body_type: Optional[str] = None
    body_content: Optional[str] = None
    body_raw_type: Optional[str] = None
    auth_type: Optional[str] = None
    auth_data: Optional[str] = None


class SavedRequestOut(BaseModel):
    id: int
    collection_id: int
    name: str
    description: str
    method: str
    url: str
    headers: str
    params: str
    body_type: str
    body_content: str
    body_raw_type: str
    auth_type: str
    auth_data: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Environment ──────────────────────────────────────────────
class EnvVariableCreate(BaseModel):
    key: str
    value: str = ""
    current_value: str = ""
    is_enabled: bool = True


class EnvVariableOut(BaseModel):
    id: int
    environment_id: int
    key: str
    value: str
    current_value: str
    is_enabled: bool

    class Config:
        from_attributes = True


class EnvironmentCreate(BaseModel):
    name: str
    variables: Optional[List[EnvVariableCreate]] = []


class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    variables: Optional[List[EnvVariableCreate]] = None


class EnvironmentOut(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    variables: List[EnvVariableOut] = []

    class Config:
        from_attributes = True


# ── History ──────────────────────────────────────────────────
class HistoryOut(BaseModel):
    id: int
    method: str
    url: str
    headers: str
    params: str
    body_type: str
    body_content: str
    body_raw_type: str
    auth_type: str
    auth_data: str
    response_status: Optional[int]
    response_time: Optional[float]
    response_size: Optional[int]
    response_headers: str
    response_body: str
    response_error: Optional[str]
    sent_at: datetime

    class Config:
        from_attributes = True


# ── Request Runner ────────────────────────────────────────────
class KeyValue(BaseModel):
    key: str
    value: str
    enabled: bool = True


class AuthData(BaseModel):
    token: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    apiKeyKey: Optional[str] = None
    apiKeyValue: Optional[str] = None
    apiKeyAddTo: Optional[str] = "header"


class RunRequest(BaseModel):
    method: str
    url: str
    headers: List[KeyValue] = []
    params: List[KeyValue] = []
    body_type: str = "none"          # none | raw | form-data | x-www-form-urlencoded
    body_content: str = ""
    body_raw_type: str = "JSON"      # JSON | Text
    auth_type: str = "none"          # none | bearer | basic
    auth_data: Optional[AuthData] = None
    environment_id: Optional[int] = None
    follow_redirects: Optional[bool] = True
    verify_ssl: Optional[bool] = True
    timeout_ms: Optional[int] = 30000


class RunResponse(BaseModel):
    status: Optional[int]
    status_text: str
    time_ms: float
    size_bytes: int
    headers: dict
    body: str
    error: Optional[str] = None
