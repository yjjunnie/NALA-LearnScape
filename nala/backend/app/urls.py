from django.urls import path
from . import views
from app.views import classify_chathistory

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/classify-chathistory/", classify_chathistory, name="classify-chathistory"),
]
