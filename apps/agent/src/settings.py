"""Centralized config — every sponsor key + fixture-mode flag."""

from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Insforge
    insforge_api_key: str = ""
    insforge_project_url: str = ""
    insforge_db_url: str = "postgres://postgres:postgres@localhost:5432/postgres"
    insforge_model: str = "llama-3.1-70b-instruct"

    # Daytona
    daytona_api_key: str = ""
    daytona_snapshot_id: str = "authmatic-v1"

    # Rtrvr.ai
    rtrvr_api_key: str = ""
    rtrvr_mode: str = "cloud"  # "cloud" | "extension" — PICK ONE

    # Opsera
    opsera_mcp_url: str = "https://mcp.opsera.io/mcp"
    opsera_token: str = ""

    # Where the user's browser hits this app — used to build the receipt
    # URL that the payer-portal step returns. In real production this would
    # be the payer's confirmation URL, not ours.
    web_base_url: str = "http://localhost:3000"

    # Demo
    demo_fixture_mode: bool = False
    fixtures_path: str = os.environ.get(
        "FIXTURES_PATH",
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "assets", "fixtures"),
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
