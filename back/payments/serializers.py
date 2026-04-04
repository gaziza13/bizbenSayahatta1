from decimal import Decimal

from rest_framework import serializers

from .models import Payment


class PaymentCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    currency = serializers.CharField(
        max_length=3,
        required=False,
        default="usd",
        trim_whitespace=True,
    )

    def validate_currency(self, value):
        return value.lower()


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "user",
            "amount",
            "currency",
            "status",
            "provider",
            "stripe_payment_intent_id",
            "stripe_checkout_session_id",
            "created_at",
        )
        read_only_fields = fields


class PaymentCreateResponseSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField()
    checkout_url = serializers.URLField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    status = serializers.CharField()
