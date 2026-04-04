import logging
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsActiveAndNotBlocked

from .models import Payment
from .serializers import (
    PaymentCreateResponseSerializer,
    PaymentCreateSerializer,
    PaymentSerializer,
)
from .services import (
    claim_stripe_event,
    mark_payment_failed,
    mark_payment_success,
)

logger = logging.getLogger("payments")


def _append_query_params(url: str, params: dict) -> str:
    parsed = urlparse(url)
    q = dict(parse_qsl(parsed.query, keep_blank_values=True))
    for k, v in params.items():
        if v is not None:
            q[k] = str(v)
    new_query = urlencode(q)
    return urlunparse(parsed._replace(query=new_query))


def _build_checkout_url(payment: Payment) -> str:
    base = settings.STRIPE_PAYMENT_LINK_URL.strip()
    if not base:
        raise ValidationError(
            {"detail": "STRIPE_PAYMENT_LINK_URL is not configured."},
        )
    return _append_query_params(
        base,
        {
            "client_reference_id": str(payment.id),
        },
    )


class PaymentCreateView(APIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked]

    def post(self, request):
        ser = PaymentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        amount = ser.validated_data["amount"]
        currency = ser.validated_data["currency"]

        payment = Payment.objects.create(
            user=request.user,
            amount=amount,
            currency=currency,
            status=Payment.Status.PENDING,
            provider="stripe",
        )
        checkout_url = _build_checkout_url(payment)
        logger.info(
            "Payment pending, checkout URL issued",
            extra={
                "payment_id": str(payment.id),
                "user_id": request.user.pk,
                "amount": str(amount),
                "currency": currency,
            },
        )
        payload = {
            "payment_id": payment.id,
            "checkout_url": checkout_url,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
        }
        out = PaymentCreateResponseSerializer(payload)
        return Response(out.data, status=status.HTTP_201_CREATED)


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked]

    def get(self, request, payment_id):
        payment = Payment.objects.filter(pk=payment_id, user=request.user).first()
        if not payment:
            raise NotFound()
        return Response(PaymentSerializer(payment).data)


def _handle_checkout_session_completed(session: dict) -> None:
    ref = session.get("client_reference_id")
    if not ref:
        logger.warning(
            "checkout.session.completed without client_reference_id",
            extra={"session_id": session.get("id")},
        )
        return
    payment = Payment.objects.filter(pk=ref).select_related("user").first()
    if not payment:
        logger.error(
            "checkout.session.completed for unknown payment",
            extra={"client_reference_id": ref},
        )
        return
    pi = session.get("payment_intent")
    pi_id = pi if isinstance(pi, str) else (pi or {}).get("id") if isinstance(pi, dict) else None
    mark_payment_success(
        payment,
        stripe_payment_intent_id=pi_id,
        stripe_checkout_session_id=session.get("id"),
    )


def _handle_payment_intent_succeeded(intent: dict) -> None:
    pi_id = intent.get("id")
    payment = None
    if pi_id:
        payment = (
            Payment.objects.filter(stripe_payment_intent_id=pi_id)
            .select_related("user")
            .first()
        )
    meta = intent.get("metadata") or {}
    pay_ref = meta.get("payment_id")
    if not payment and pay_ref:
        payment = (
            Payment.objects.filter(pk=pay_ref).select_related("user").first()
        )
    if not payment:
        # For Payment Links, checkout.session.completed usually carries client_reference_id first;
        # this handler supplements when the Payment row already has stripe_payment_intent_id.
        logger.info(
            "payment_intent.succeeded skipped (no matching Payment yet; checkout may follow)",
            extra={"payment_intent_id": pi_id},
        )
        return
    mark_payment_success(
        payment,
        stripe_payment_intent_id=pi_id,
    )


def _handle_checkout_session_async_failed(session: dict) -> None:
    ref = session.get("client_reference_id")
    if not ref:
        return
    payment = Payment.objects.filter(pk=ref).first()
    if not payment:
        return
    pi = session.get("payment_intent")
    pi_id = pi if isinstance(pi, str) else (pi or {}).get("id") if isinstance(pi, dict) else None
    mark_payment_failed(payment, stripe_payment_intent_id=pi_id)


def _handle_payment_intent_failed(intent: dict) -> None:
    pi_id = intent.get("id")
    payment = None
    if pi_id:
        payment = Payment.objects.filter(stripe_payment_intent_id=pi_id).first()
    meta = intent.get("metadata") or {}
    pay_ref = meta.get("payment_id")
    if not payment and pay_ref:
        payment = Payment.objects.filter(pk=pay_ref).first()
    if not payment:
        logger.warning(
            "payment_intent.payment_failed could not be matched to a Payment",
            extra={"payment_intent_id": pi_id},
        )
        return
    mark_payment_failed(payment, stripe_payment_intent_id=pi_id)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
        secret = settings.STRIPE_WEBHOOK_SECRET
        if not secret:
            logger.error("STRIPE_WEBHOOK_SECRET is not set")
            return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                secret,
            )
        except ValueError as e:
            logger.warning("Invalid Stripe webhook payload", extra={"error": str(e)})
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            logger.warning(
                "Invalid Stripe webhook signature",
                extra={"error": str(e)},
            )
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        event_id = event.get("id")
        event_type = event.get("type")
        if not event_id or not event_type:
            return HttpResponse(status=status.HTTP_400_BAD_REQUEST)

        if not claim_stripe_event(event_id, event_type):
            return HttpResponse(status=status.HTTP_200_OK)

        logger.info(
            "Stripe webhook received",
            extra={"stripe_event_id": event_id, "event_type": event_type},
        )

        data_object = (event.get("data") or {}).get("object") or {}

        try:
            if event_type == "checkout.session.completed":
                _handle_checkout_session_completed(data_object)
            elif event_type == "payment_intent.succeeded":
                _handle_payment_intent_succeeded(data_object)
            elif event_type == "payment_intent.payment_failed":
                _handle_payment_intent_failed(data_object)
            elif event_type == "checkout.session.async_payment_failed":
                _handle_checkout_session_async_failed(data_object)
            else:
                logger.info(
                    "Stripe webhook event ignored (no handler)",
                    extra={"event_type": event_type},
                )
        except Exception:
            logger.exception(
                "Stripe webhook handler failed",
                extra={"stripe_event_id": event_id, "event_type": event_type},
            )
            return HttpResponse(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return HttpResponse(status=status.HTTP_200_OK)
