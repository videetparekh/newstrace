from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    news_api_key: str = ""
    cache_ttl_minutes: int = 120  # 2 hours - reduced API calls while still keeping headlines fresh
    locations_file: str = "data/locations.json"

    model_config = {"env_prefix": "", "env_file": ".env"}


settings = Settings()
