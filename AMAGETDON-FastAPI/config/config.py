from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MySQL
    mysql_host: str
    mysql_port: int
    mysql_user: str
    mysql_password: str
    mysql_database: str

    class Config:
        env_file = ".env"

settings = Settings()