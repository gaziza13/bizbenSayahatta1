from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "payments"
    verbose_name = "Payments"

    def ready(self):
        # Configure Stripe API key once for the Stripe Python SDK.
        from django.conf import settings

        import stripe

        key = getattr(settings, "STRIPE_SECRET_KEY", None) or ""
        stripe.api_key = key
