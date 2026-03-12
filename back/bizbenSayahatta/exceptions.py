import logging
import uuid

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("bizbenSayahatta.errors")


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get("request")
    request_id = getattr(request, "request_id", None)
    user = getattr(request, "user", None) if request else None
    user_id = getattr(user, "id", None)
    role = getattr(user, "role", None)
    path = getattr(request, "path", None) if request else None
    method = getattr(request, "method", None) if request else None
    remote_addr = request.META.get("REMOTE_ADDR") if request else None

    if response is None:
        error_id = uuid.uuid4().hex
        logger.error(
            "Unhandled exception",
            exc_info=exc,
            extra={
                "request_id": request_id,
                "path": path,
                "method": method,
                "user_id": user_id,
                "role": role,
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "error_id": error_id,
                "remote_addr": remote_addr,
            },
        )
        return Response(
            {
                "detail": "Internal server error. Please try again later.",
                "code": "internal_server_error",
                "error_id": error_id,
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data.get("detail") if isinstance(response.data, dict) else None
    if not detail:
        if response.status_code >= 500:
            detail = "Internal server error. Please try again later."
        elif response.status_code == 404:
            detail = "Resource not found."
        elif response.status_code == 403:
            detail = "You do not have permission to perform this action."
        elif response.status_code == 401:
            detail = "Authentication credentials were not provided or are invalid."
        elif response.status_code == 400:
            detail = "Invalid request payload."
        else:
            detail = "Request failed."

    if response.status_code == 400:
        error_id = uuid.uuid4().hex
        error_fields = []
        if isinstance(response.data, dict):
            error_fields = [key for key in response.data.keys() if key != "detail"]

        logger.warning(
            "Validation error",
            extra={
                "request_id": request_id,
                "path": path,
                "method": method,
                "user_id": user_id,
                "role": role,
                "status_code": response.status_code,
                "error_id": error_id,
                "remote_addr": remote_addr,
            },
        )

        response.data = {
            "detail": "Invalid request payload.",
            "status_code": response.status_code,
            "error_id": error_id,
            "errors": error_fields,
        }
        return response

    if response.status_code >= 500:
        error_id = uuid.uuid4().hex
        logger.error(
            "Server error response",
            exc_info=exc,
            extra={
                "request_id": request_id,
                "path": path,
                "method": method,
                "user_id": user_id,
                "role": role,
                "status_code": response.status_code,
                "error_id": error_id,
                "remote_addr": remote_addr,
            },
        )
        response.data = {
            "detail": detail,
            "error_id": error_id,
            "status_code": response.status_code,
        }
        return response

    response.data = {
        "detail": detail,
        "status_code": response.status_code,
    }
    return response
