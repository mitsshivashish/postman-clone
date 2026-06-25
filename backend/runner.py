"""HTTP request runner — sends real outbound requests on behalf of the client."""
import json
import time
import re
from typing import Optional
import httpx
from schemas import RunRequest, RunResponse


def resolve_variables(text: str, variables: dict) -> str:
    """Replace {{variable}} placeholders with their values."""
    def replacer(match):
        key = match.group(1).strip()
        return variables.get(key, match.group(0))
    return re.sub(r'\{\{([^}]+)\}\}', replacer, text)


async def execute_request(req: RunRequest, variables: dict = {}) -> RunResponse:
    method = req.method.upper()

    # Resolve URL
    url = resolve_variables(req.url.strip(), variables)
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Build headers dict
    headers = {}
    for h in req.headers:
        if h.enabled and h.key.strip():
            headers[resolve_variables(h.key, variables)] = resolve_variables(h.value, variables)

    # Query params
    params = {}
    for p in req.params:
        if p.enabled and p.key.strip():
            params[resolve_variables(p.key, variables)] = resolve_variables(p.value, variables)

    # Set default browser-like User-Agent if not specified by user
    if not any(k.lower() == "user-agent" for k in headers.keys()):
        headers["User-Agent"] = "PostmanClone/1.0 (contact: admin@postmanclone.local)"

    # Auth
    if req.auth_type == "bearer" and req.auth_data and req.auth_data.token:
        headers["Authorization"] = f"Bearer {resolve_variables(req.auth_data.token, variables)}"
    elif req.auth_type == "basic" and req.auth_data:
        import base64
        username = resolve_variables(req.auth_data.username or "", variables)
        password = resolve_variables(req.auth_data.password or "", variables)
        token = base64.b64encode(f"{username}:{password}".encode()).decode()
        headers["Authorization"] = f"Basic {token}"
    elif req.auth_type == "apikey" and req.auth_data and req.auth_data.apiKeyKey:
        key = resolve_variables(req.auth_data.apiKeyKey, variables)
        val = resolve_variables(req.auth_data.apiKeyValue or "", variables)
        if req.auth_data.apiKeyAddTo == "query":
            params[key] = val
        else:
            headers[key] = val

    # Build body
    content = None
    data = None
    files = None
    json_body = None

    if req.body_type == "raw":
        raw = resolve_variables(req.body_content, variables)
        if req.body_raw_type == "JSON":
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/json"
            try:
                json_body = json.loads(raw)
            except Exception:
                content = raw.encode()
        else:
            content = raw.encode()
    elif req.body_type == "x-www-form-urlencoded":
        if "Content-Type" not in headers:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        try:
            pairs = json.loads(req.body_content)
            data = {
                resolve_variables(p["key"], variables): resolve_variables(p["value"], variables)
                for p in pairs if p.get("enabled", True) and p.get("key", "").strip()
            }
        except Exception:
            data = {}
    elif req.body_type == "form-data":
        try:
            pairs = json.loads(req.body_content)
            files = {
                resolve_variables(p["key"], variables): (None, resolve_variables(p["value"], variables))
                for p in pairs if p.get("enabled", True) and p.get("key", "").strip()
            }
        except Exception:
            files = {}

    # Read settings parameters from request payload
    follow_redirects = req.follow_redirects if req.follow_redirects is not None else True
    verify = req.verify_ssl if req.verify_ssl is not None else True
    timeout = (req.timeout_ms / 1000.0) if (req.timeout_ms is not None and req.timeout_ms > 0) else None

    start = time.time()
    try:
        async with httpx.AsyncClient(follow_redirects=follow_redirects, verify=verify, timeout=timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                params=params if params else None,
                json=json_body,
                content=content,
                data=data,
                files=files,
            )
        elapsed = (time.time() - start) * 1000

        body = response.text
        size = len(response.content)

        # Aggregate Set-Cookie headers from redirect history and final response
        set_cookies = []
        for hist in response.history:
            set_cookies.extend(hist.headers.get_list("set-cookie"))
        set_cookies.extend(response.headers.get_list("set-cookie"))

        resp_headers = dict(response.headers)
        for k in list(resp_headers.keys()):
            if k.lower() == "set-cookie":
                del resp_headers[k]
        if set_cookies:
            resp_headers["Set-Cookie"] = ", ".join(set_cookies)

        return RunResponse(
            status=response.status_code,
            status_text=response.reason_phrase or "",
            time_ms=round(elapsed, 2),
            size_bytes=size,
            headers=resp_headers,
            body=body,
            error=None,
        )
    except httpx.TimeoutException:
        elapsed = (time.time() - start) * 1000
        limit_str = f"{req.timeout_ms / 1000.0} seconds" if req.timeout_ms else "30 seconds"
        return RunResponse(
            status=None,
            status_text="Timeout",
            time_ms=round(elapsed, 2),
            size_bytes=0,
            headers={},
            body="",
            error=f"Request timed out after {limit_str}.",
        )
    except httpx.InvalidURL as e:
        return RunResponse(
            status=None,
            status_text="Invalid URL",
            time_ms=0,
            size_bytes=0,
            headers={},
            body="",
            error=f"Invalid URL: {str(e)}",
        )
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        return RunResponse(
            status=None,
            status_text="Error",
            time_ms=round(elapsed, 2),
            size_bytes=0,
            headers={},
            body="",
            error=str(e),
        )
