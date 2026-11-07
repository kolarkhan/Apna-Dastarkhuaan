import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from fastapi import UploadFile

from app.config import get_settings

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB


class StorageProvider(ABC):
    @abstractmethod
    async def upload(self, file: UploadFile, folder: str) -> str:
        """Uploads a file and returns its public URL."""
        raise NotImplementedError


class LocalStorageProvider(StorageProvider):
    """Dev fallback: writes to disk and serves via a static mount. No cloud account needed."""

    async def upload(self, file: UploadFile, folder: str) -> str:
        base_dir = Path(settings.local_storage_dir) / folder
        base_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename or "").suffix or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = base_dir / filename

        contents = await file.read()
        with open(dest, "wb") as f:
            f.write(contents)

        return f"{settings.local_storage_public_url}/{folder}/{filename}"


class CloudinaryStorageProvider(StorageProvider):
    def __init__(self) -> None:
        import cloudinary

        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )

    async def upload(self, file: UploadFile, folder: str) -> str:
        import cloudinary.uploader

        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            folder=f"dastarkhuaan/{folder}",
            resource_type="image",
        )
        return result["secure_url"]


def validate_image_upload(file: UploadFile) -> None:
    from app.core.exceptions import ValidationAppError

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationAppError("Only JPEG, PNG, or WEBP images are allowed")
    if file.size is not None and file.size > MAX_UPLOAD_BYTES:
        raise ValidationAppError("Image must be smaller than 8MB")


_provider: StorageProvider | None = None


def get_storage_provider() -> StorageProvider:
    global _provider
    if _provider is None:
        _provider = CloudinaryStorageProvider() if settings.cloudinary_configured else LocalStorageProvider()
    return _provider
