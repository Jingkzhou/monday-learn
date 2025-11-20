import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Determine environment
APP_ENV = os.getenv("APP_ENV", "dev")
env_file = f".env.{APP_ENV}"

# Load specific env file
load_dotenv(env_file)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Monday Learn API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_SERVER: str = os.getenv("MYSQL_SERVER", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "monday_learn")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

    class Config:
        case_sensitive = True

settings = Settings()
