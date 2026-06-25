import os
from pathlib import Path
from dotenv import load_dotenv

# 1. Determine environment
# Check APP_ENV, FASTAPI_ENV, NODE_ENV in order, defaulting to 'development'
env = os.getenv("APP_ENV") or os.getenv("FASTAPI_ENV") or os.getenv("NODE_ENV") or "development"
env = env.lower().strip()

# 2. Get base directory of the backend project
BASE_DIR = Path(__file__).resolve().parent

# 3. Load dotenv files in increasing order of priority (with override=True to allow customization)
# Priority: .env (base) < .env.{env} (env-specific) < .env.local (local overrides)

# A. Load base .env
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file, override=True)

# B. Load environment-specific env (e.g. .env.development or .env.production)
env_specific_file = BASE_DIR / f".env.{env}"
if env_specific_file.exists():
    load_dotenv(dotenv_path=env_specific_file, override=True)

# C. Load local overrides .env.local
env_local_file = BASE_DIR / ".env.local"
if env_local_file.exists():
    load_dotenv(dotenv_path=env_local_file, override=True)

print(f"[{__name__}] Loaded environment variables for APP_ENV: {env}")
