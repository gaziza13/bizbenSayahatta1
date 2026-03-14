from django.urls import path
from .views import RegisterView, UserProfileView, CustomTokenObtainPairView

urlpatterns = [
    path('signup/', RegisterView.as_view()),
    path('login/', CustomTokenObtainPairView.as_view()),
    path('profile/', UserProfileView.as_view())
]