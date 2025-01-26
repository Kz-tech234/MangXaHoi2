from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from mangxahois import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'baidangs', views.BaiDangViewSet)
router.register(r'binhluans', views.BinhLuanViewSet)
router.register(r'reactions', views.ReactionViewSet)
router.register(r'khaosats', views.KhaoSatViewSet)
router.register(r'cauhois', views.CauHoiViewSet)
router.register(r'luachons', views.LuaChonViewSet)
router.register(r'tralois', views.TraLoiViewSet)
router.register(r'thongbaosukiens', views.ThongBaoSuKienViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)