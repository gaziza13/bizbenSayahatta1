from django.contrib import admin

from .models import Payment, StripeWebhookEvent


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "amount",
        "currency",
        "status",
        "provider",
        "stripe_payment_intent_id",
        "created_at",
    )
    list_filter = ("status", "provider", "currency")
    search_fields = ("id", "user__email", "stripe_payment_intent_id", "stripe_checkout_session_id")
    readonly_fields = ("id", "created_at")


@admin.register(StripeWebhookEvent)
class StripeWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("stripe_event_id", "event_type", "received_at")
    search_fields = ("stripe_event_id", "event_type")
    readonly_fields = ("stripe_event_id", "event_type", "received_at")
