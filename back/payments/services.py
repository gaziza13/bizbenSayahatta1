import logging

from django.db import transaction
from django.db.utils import IntegrityError

from users.models import User

from .models import Payment, StripeWebhookEvent

logger = logging.getLogger("payments")


def grant_paid_access(user: User) -> None:
    """
    Unlock premium access after a successful payment.
    Uses existing subscription_status on User.
    """
    updated = User.objects.filter(pk=user.pk).exclude(
        subscription_status=User.SubscriptionStatus.ACTIVE,
    ).update(subscription_status=User.SubscriptionStatus.ACTIVE)
    if updated:
        logger.info("Granted paid access", extra={"user_id": user.pk})


def mark_payment_success(
    payment: Payment,
    *,
    stripe_payment_intent_id: str | None,
    stripe_checkout_session_id: str | None = None,
) -> bool:
    """
    Idempotently mark payment as success and grant access.
    Returns True if this call transitioned the payment to success.
    """
    with transaction.atomic():
        locked = (
            Payment.objects.select_for_update()
            .filter(pk=payment.pk)
            .first()
        )
        if not locked:
            return False
        if locked.status == Payment.Status.SUCCESS:
            return False

        kwargs = {"status": Payment.Status.SUCCESS}
        if stripe_payment_intent_id:
            kwargs["stripe_payment_intent_id"] = stripe_payment_intent_id
        if stripe_checkout_session_id:
            kwargs["stripe_checkout_session_id"] = stripe_checkout_session_id

        Payment.objects.filter(pk=locked.pk).update(**kwargs)
        payment.refresh_from_db()
        grant_paid_access(payment.user)
    return True


def mark_payment_failed(
    payment: Payment,
    *,
    stripe_payment_intent_id: str | None = None,
) -> None:
    with transaction.atomic():
        locked = (
            Payment.objects.select_for_update()
            .filter(pk=payment.pk)
            .first()
        )
        if not locked or locked.status != Payment.Status.PENDING:
            return
        values = {"status": Payment.Status.FAILED}
        if stripe_payment_intent_id and not locked.stripe_payment_intent_id:
            values["stripe_payment_intent_id"] = stripe_payment_intent_id
        Payment.objects.filter(pk=locked.pk).update(**values)
    logger.warning(
        "Payment marked failed",
        extra={"payment_id": str(payment.pk), "user_id": payment.user_id},
    )


def claim_stripe_event(stripe_event_id: str, event_type: str) -> bool:
    """
    Insert event id; return True if this worker should process the event,
    False if another request already recorded it (idempotent no-op).
    """
    try:
        StripeWebhookEvent.objects.create(
            stripe_event_id=stripe_event_id,
            event_type=event_type,
        )
        return True
    except IntegrityError:
        logger.info(
            "Duplicate Stripe webhook ignored",
            extra={"stripe_event_id": stripe_event_id, "event_type": event_type},
        )
        return False
