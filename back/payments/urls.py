from django.urls import path

from . import views

urlpatterns = [
    path("create/", views.PaymentCreateView.as_view(), name="payment-create"),
    path("webhook/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
    path("<uuid:payment_id>/", views.PaymentDetailView.as_view(), name="payment-detail"),
]
