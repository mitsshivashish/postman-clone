import config
import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import (
    get_db, create_tables,
    Collection, SavedRequest, Environment, EnvironmentVariable, History,
)
from schemas import (
    CollectionCreate, CollectionUpdate, CollectionOut,
    SavedRequestCreate, SavedRequestUpdate, SavedRequestOut,
    EnvironmentCreate, EnvironmentUpdate, EnvironmentOut,
    HistoryOut, RunRequest, RunResponse,
)
from runner import execute_request

import os

app = FastAPI(title="Postman Clone API", version="1.0.0")

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip().rstrip("/") for o in allowed_origins_str.split(",") if o.strip()]

# Credentials are not allowed with wildcard '*' origin in CORS spec
allow_credentials = True
if "*" in allowed_origins:
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()

    # Dynamic migrations using ALTER TABLE (preserves data and avoids Windows file lock issues)
    from database import engine
    from sqlalchemy import text
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE saved_requests ADD COLUMN description TEXT DEFAULT ''"))
            print("Migration: Added column 'description' to 'saved_requests'")
        except Exception:
            pass  # column already exists or table doesn't exist
            
        try:
            conn.execute(text("ALTER TABLE environment_variables ADD COLUMN current_value TEXT DEFAULT ''"))
            print("Migration: Added column 'current_value' to 'environment_variables'")
        except Exception:
            pass  # column already exists

    seed_data()


# ════════════════════════════════════════════════
#  COLLECTIONS
# ════════════════════════════════════════════════

@app.get("/api/collections", response_model=List[CollectionOut])
def list_collections(db: Session = Depends(get_db)):
    return db.query(Collection).order_by(Collection.created_at).all()


@app.post("/api/collections", response_model=CollectionOut, status_code=201)
def create_collection(body: CollectionCreate, db: Session = Depends(get_db)):
    col = Collection(name=body.name, description=body.description or "")
    db.add(col)
    db.commit()
    db.refresh(col)
    return col


@app.get("/api/collections/{col_id}", response_model=CollectionOut)
def get_collection(col_id: int, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    return col


@app.put("/api/collections/{col_id}", response_model=CollectionOut)
def update_collection(col_id: int, body: CollectionUpdate, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    if body.name is not None:
        col.name = body.name
    if body.description is not None:
        col.description = body.description
    col.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(col)
    return col


@app.delete("/api/collections/{col_id}", status_code=204)
def delete_collection(col_id: int, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    db.delete(col)
    db.commit()


@app.get("/api/collections/{col_id}/export")
def export_collection(col_id: int, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == col_id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    requests_data = []
    for r in col.requests:
        requests_data.append({
            "name": r.name,
            "description": r.description,
            "method": r.method,
            "url": r.url,
            "headers": r.headers,
            "params": r.params,
            "body_type": r.body_type,
            "body_content": r.body_content,
            "body_raw_type": r.body_raw_type,
            "auth_type": r.auth_type,
            "auth_data": r.auth_data
        })
    return {
        "name": col.name,
        "description": col.description,
        "requests": requests_data
    }


@app.post("/api/collections/import", response_model=CollectionOut, status_code=201)
def import_collection(body: dict, db: Session = Depends(get_db)):
    name = body.get("name", "Imported Collection")
    desc = body.get("description", "")
    col = Collection(name=name, description=desc)
    db.add(col)
    db.flush()
    
    requests_data = body.get("requests", [])
    for r in requests_data:
        saved_req = SavedRequest(
            collection_id=col.id,
            name=r.get("name", "Untitled Request"),
            description=r.get("description", ""),
            method=r.get("method", "GET"),
            url=r.get("url", ""),
            headers=r.get("headers", "[]"),
            params=r.get("params", "[]"),
            body_type=r.get("body_type", "none"),
            body_content=r.get("body_content", ""),
            body_raw_type=r.get("body_raw_type", "JSON"),
            auth_type=r.get("auth_type", "none"),
            auth_data=r.get("auth_data", "{}")
        )
        db.add(saved_req)
    
    db.commit()
    db.refresh(col)
    return col


# ════════════════════════════════════════════════
#  SAVED REQUESTS
# ════════════════════════════════════════════════

@app.get("/api/collections/{col_id}/requests", response_model=List[SavedRequestOut])
def list_requests(col_id: int, db: Session = Depends(get_db)):
    return db.query(SavedRequest).filter(SavedRequest.collection_id == col_id).order_by(SavedRequest.created_at).all()


@app.post("/api/requests", response_model=SavedRequestOut, status_code=201)
def create_request(body: SavedRequestCreate, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == body.collection_id).first()
    if not col:
        raise HTTPException(404, "Collection not found")
    req = SavedRequest(**body.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@app.get("/api/requests/{req_id}", response_model=SavedRequestOut)
def get_request(req_id: int, db: Session = Depends(get_db)):
    req = db.query(SavedRequest).filter(SavedRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    return req


@app.put("/api/requests/{req_id}", response_model=SavedRequestOut)
def update_request(req_id: int, body: SavedRequestUpdate, db: Session = Depends(get_db)):
    req = db.query(SavedRequest).filter(SavedRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(req, field, val)
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return req


@app.delete("/api/requests/{req_id}", status_code=204)
def delete_request(req_id: int, db: Session = Depends(get_db)):
    req = db.query(SavedRequest).filter(SavedRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    db.delete(req)
    db.commit()


# ════════════════════════════════════════════════
#  ENVIRONMENTS
# ════════════════════════════════════════════════

@app.get("/api/environments", response_model=List[EnvironmentOut])
def list_environments(db: Session = Depends(get_db)):
    return db.query(Environment).order_by(Environment.created_at).all()


@app.post("/api/environments", response_model=EnvironmentOut, status_code=201)
def create_environment(body: EnvironmentCreate, db: Session = Depends(get_db)):
    env = Environment(name=body.name)
    db.add(env)
    db.flush()
    for v in (body.variables or []):
        db.add(EnvironmentVariable(environment_id=env.id, key=v.key, value=v.value, current_value=v.current_value, is_enabled=v.is_enabled))
    db.commit()
    db.refresh(env)
    return env


@app.get("/api/environments/{env_id}", response_model=EnvironmentOut)
def get_environment(env_id: int, db: Session = Depends(get_db)):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(404, "Environment not found")
    return env


@app.put("/api/environments/{env_id}", response_model=EnvironmentOut)
def update_environment(env_id: int, body: EnvironmentUpdate, db: Session = Depends(get_db)):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(404, "Environment not found")
    if body.name is not None:
        env.name = body.name
    if body.variables is not None:
        db.query(EnvironmentVariable).filter(EnvironmentVariable.environment_id == env_id).delete()
        for v in body.variables:
            db.add(EnvironmentVariable(environment_id=env.id, key=v.key, value=v.value, current_value=v.current_value, is_enabled=v.is_enabled))
    env.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(env)
    return env


@app.delete("/api/environments/{env_id}", status_code=204)
def delete_environment(env_id: int, db: Session = Depends(get_db)):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(404, "Environment not found")
    db.delete(env)
    db.commit()


@app.post("/api/environments/{env_id}/activate", response_model=EnvironmentOut)
def activate_environment(env_id: int, db: Session = Depends(get_db)):
    db.query(Environment).update({Environment.is_active: False})
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(404, "Environment not found")
    env.is_active = True
    db.commit()
    db.refresh(env)
    return env


@app.post("/api/environments/deactivate", status_code=204)
def deactivate_all(db: Session = Depends(get_db)):
    db.query(Environment).update({Environment.is_active: False})
    db.commit()


# ════════════════════════════════════════════════
#  HISTORY
# ════════════════════════════════════════════════

@app.get("/api/history", response_model=List[HistoryOut])
def list_history(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(History).order_by(History.sent_at.desc()).limit(limit).all()


@app.delete("/api/history", status_code=204)
def clear_history(db: Session = Depends(get_db)):
    db.query(History).delete()
    db.commit()


@app.delete("/api/history/{history_id}", status_code=204)
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    item = db.query(History).filter(History.id == history_id).first()
    if not item:
        raise HTTPException(404, "History item not found")
    db.delete(item)
    db.commit()


# ════════════════════════════════════════════════
#  REQUEST RUNNER
# ════════════════════════════════════════════════

@app.post("/api/run", response_model=RunResponse)
async def run_request(req: RunRequest, db: Session = Depends(get_db)):
    print("INCOMING RUN REQUEST PAYLOAD:", req.model_dump())
    # Gather environment variables for substitution
    variables = {}
    if req.environment_id:
        env = db.query(Environment).filter(Environment.id == req.environment_id).first()
        if env:
            for v in env.variables:
                if v.is_enabled:
                    variables[v.key] = v.current_value if (v.current_value is not None and v.current_value.strip() != "") else v.value

    result = await execute_request(req, variables)

    # Persist to history
    history = History(
        method=req.method,
        url=req.url,
        headers=json.dumps([h.model_dump() for h in req.headers]),
        params=json.dumps([p.model_dump() for p in req.params]),
        body_type=req.body_type,
        body_content=req.body_content,
        body_raw_type=req.body_raw_type,
        auth_type=req.auth_type,
        auth_data=json.dumps(req.auth_data.model_dump() if req.auth_data else {}),
        response_status=result.status,
        response_time=result.time_ms,
        response_size=result.size_bytes,
        response_headers=json.dumps(result.headers),
        response_body=result.body[:500000],  # cap at 500KB
        response_error=result.error,
    )
    db.add(history)
    db.commit()

    return result


# ════════════════════════════════════════════════
#  SEED DATA
# ════════════════════════════════════════════════

def seed_data():
    db = SessionLocal()
    try:
        if db.query(Collection).count() > 0:
            return  # already seeded

        # ── Collections ─────────────────────────────
        col1 = Collection(name="JSONPlaceholder", description="Sample requests against jsonplaceholder.typicode.com")
        col2 = Collection(name="HTTPBin", description="HTTP inspection requests via httpbin.org")
        db.add_all([col1, col2])
        db.flush()

        # ── Requests for col1 ───────────────────────
        reqs_col1 = [
            SavedRequest(collection_id=col1.id, name="Get All Posts", method="GET",
                         description="Retrieve list of all posts from JSONPlaceholder server",
                         url="https://jsonplaceholder.typicode.com/posts",
                         headers="[]", params="[]"),
            SavedRequest(collection_id=col1.id, name="Get Post by ID", method="GET",
                         description="Retrieve a single post by its numerical identifier",
                         url="https://jsonplaceholder.typicode.com/posts/1",
                         headers="[]", params="[]"),
            SavedRequest(collection_id=col1.id, name="Create Post", method="POST",
                         description="Create a new post with a JSON payload",
                         url="https://jsonplaceholder.typicode.com/posts",
                         headers='[{"key":"Content-Type","value":"application/json","enabled":true}]',
                         body_type="raw", body_raw_type="JSON",
                         body_content='{\n  "title": "Hello World",\n  "body": "This is the body",\n  "userId": 1\n}'),
            SavedRequest(collection_id=col1.id, name="Update Post", method="PUT",
                         description="Overwrite an existing post's parameters",
                         url="https://jsonplaceholder.typicode.com/posts/1",
                         headers='[{"key":"Content-Type","value":"application/json","enabled":true}]',
                         body_type="raw", body_raw_type="JSON",
                         body_content='{\n  "id": 1,\n  "title": "Updated Title",\n  "body": "Updated body",\n  "userId": 1\n}'),
            SavedRequest(collection_id=col1.id, name="Delete Post", method="DELETE",
                         description="Remove a post resource by ID",
                         url="https://jsonplaceholder.typicode.com/posts/1",
                         headers="[]", params="[]"),
            SavedRequest(collection_id=col1.id, name="Get Users", method="GET",
                         description="Fetch all mock users available on the system",
                         url="https://jsonplaceholder.typicode.com/users",
                         headers="[]", params="[]"),
        ]
        db.add_all(reqs_col1)

        # ── Requests for col2 ───────────────────────
        reqs_col2 = [
            SavedRequest(collection_id=col2.id, name="GET /get", method="GET",
                         description="Simple GET request with custom query parameters",
                         url="https://httpbin.org/get",
                         params='[{"key":"foo","value":"bar","enabled":true}]'),
            SavedRequest(collection_id=col2.id, name="POST /post (JSON)", method="POST",
                         description="Simple POST request with a raw JSON payload",
                         url="https://httpbin.org/post",
                         headers='[{"key":"Content-Type","value":"application/json","enabled":true}]',
                         body_type="raw", body_raw_type="JSON",
                         body_content='{\n  "name": "Postman Clone",\n  "version": "1.0"\n}'),
            SavedRequest(collection_id=col2.id, name="Bearer Auth", method="GET",
                         description="Retrieve request requiring bearer token authentication",
                         url="https://httpbin.org/bearer",
                         auth_type="bearer",
                         auth_data='{"token":"{{API_TOKEN}}","username":null,"password":null}'),
            SavedRequest(collection_id=col2.id, name="Basic Auth", method="GET",
                         description="Retrieve request requiring username and password credentials",
                         url="https://httpbin.org/basic-auth/user/pass",
                         auth_type="basic",
                         auth_data='{"token":null,"username":"user","password":"pass"}'),
            SavedRequest(collection_id=col2.id, name="Response Status 404", method="GET",
                         description="Force httpbin to respond with a 404 Status Code",
                         url="https://httpbin.org/status/404",
                         headers="[]", params="[]"),
            SavedRequest(collection_id=col2.id, name="Delay 2s", method="GET",
                         description="Delay HTTP request completion by 2 seconds",
                         url="https://httpbin.org/delay/2",
                         headers="[]", params="[]"),
        ]
        db.add_all(reqs_col2)

        # ── Environments ─────────────────────────────
        env1 = Environment(name="Development", is_active=True)
        env2 = Environment(name="Production")
        db.add_all([env1, env2])
        db.flush()

        dev_vars = [
            EnvironmentVariable(environment_id=env1.id, key="BASE_URL", value="https://jsonplaceholder.typicode.com", current_value="https://jsonplaceholder.typicode.com"),
            EnvironmentVariable(environment_id=env1.id, key="API_TOKEN", value="dev-token-12345", current_value="dev-token-12345"),
            EnvironmentVariable(environment_id=env1.id, key="USER_ID", value="1", current_value="1"),
        ]
        prod_vars = [
            EnvironmentVariable(environment_id=env2.id, key="BASE_URL", value="https://api.example.com", current_value="https://api.example.com"),
            EnvironmentVariable(environment_id=env2.id, key="API_TOKEN", value="prod-token-xyz", current_value="prod-token-xyz"),
            EnvironmentVariable(environment_id=env2.id, key="USER_ID", value="42", current_value="42"),
        ]
        db.add_all(dev_vars + prod_vars)

        # ── History ──────────────────────────────────
        sample_history = [
            History(method="GET", url="https://jsonplaceholder.typicode.com/posts",
                    headers="[]", params="[]", body_type="none",
                    response_status=200, response_time=312.5, response_size=27520,
                    response_headers='{"content-type":"application/json"}',
                    response_body='[{"userId":1,"id":1,"title":"sunt aut facere...","body":"quia et suscipit..."}]'),
            History(method="POST", url="https://jsonplaceholder.typicode.com/posts",
                    headers='[{"key":"Content-Type","value":"application/json","enabled":true}]',
                    params="[]", body_type="raw", body_raw_type="JSON",
                    body_content='{"title":"test","body":"hello","userId":1}',
                    response_status=201, response_time=456.2, response_size=89,
                    response_headers='{"content-type":"application/json"}',
                    response_body='{"id":101,"title":"test","body":"hello","userId":1}'),
            History(method="GET", url="https://httpbin.org/get",
                    headers="[]", params='[{"key":"foo","value":"bar","enabled":true}]',
                    body_type="none",
                    response_status=200, response_time=890.1, response_size=450,
                    response_headers='{"content-type":"application/json"}',
                    response_body='{"args":{"foo":"bar"},"headers":{},"url":"https://httpbin.org/get?foo=bar"}'),
        ]
        db.add_all(sample_history)
        db.commit()
    finally:
        db.close()


from database import SessionLocal
