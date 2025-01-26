from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.decorators import action, permission_classes
from rest_framework import status, permissions
from django.http import JsonResponse
from django.db.models import Count
from django.db.models.functions import TruncYear, TruncQuarter, TruncMonth, ExtractYear

from .models import User, BaiDang, BinhLuan, Reaction, TraLoi, KhaoSat, CauHoi, LuaChon, ThongBaoSuKien
from .serializers import (
    UserSerializer, BaiDangSerializer, BinhLuanSerializer, ReactionSerializer, TraLoiSerializer, KhaoSatSerializer,
    CauHoiSerializer, LuaChonSerializer, ThongBaoSuKienSerializer
)


# ViewSet cho User
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action == 'retrieve':
            return [permissions.IsAuthenticated()]
        return super().get_permissions()


# ViewSet cho BaiDang
class BaiDangViewSet(viewsets.ModelViewSet):
    queryset = BaiDang.objects.all()
    serializer_class = BaiDangSerializer

    @action(methods=['post'], detail=True, url_path="khoa-binh-luan", url_name="khoa_binh_luan")
    def khoa_binh_luan(self, request, pk=None):
        try:
            baidang = BaiDang.objects.get(pk=pk)
            baidang.khoa_binh_luan = True
            baidang.save()
            return Response({"message": "Bình luận đã bị khóa."}, status=status.HTTP_200_OK)
        except BaiDang.DoesNotExist:
            return Response({"error": "Bài viết không tồn tại."}, status=status.HTTP_404_NOT_FOUND)


# ViewSet cho BinhLuan
class BinhLuanViewSet(viewsets.ModelViewSet):
    queryset = BinhLuan.objects.all()
    serializer_class = BinhLuanSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.nguoiBinhLuan == request.user or instance.baiDang.nguoiDangBai == request.user:
            self.perform_destroy(instance)
            return Response({"message": "Bình luận đã bị xóa."}, status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Bạn không có quyền xóa bình luận này."}, status=status.HTTP_403_FORBIDDEN)


# ViewSet cho Reaction (Like, Haha, Love)
class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer

    def create(self, request, *args, **kwargs):
        existing_reaction = Reaction.objects.filter(
            baiDang=request.data.get('baiDang'),
            nguoiThucHien=request.user
        ).first()

        if existing_reaction:
            existing_reaction.loai = request.data.get('loai')
            existing_reaction.save()
            return Response({"message": "Cảm xúc đã được cập nhật."}, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

class KhaoSatViewSet(viewsets.ModelViewSet):
    queryset = KhaoSat.objects.all()
    serializer_class = KhaoSatSerializer

class CauHoiViewSet(viewsets.ModelViewSet):
    queryset = CauHoi.objects.all()
    serializer_class = CauHoiSerializer

class LuaChonViewSet(viewsets.ModelViewSet):
    queryset = LuaChon.objects.all()
    serializer_class = LuaChonSerializer

class TraLoiViewSet(viewsets.ModelViewSet):
    queryset = TraLoi.objects.all()
    serializer_class = TraLoiSerializer

class ThongBaoSuKienViewSet(viewsets.ModelViewSet):
    queryset = ThongBaoSuKien.objects.all().order_by('-ngay_gui')
    serializer_class = ThongBaoSuKienSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(nguoiGui=self.request.user)
# API thống kê người dùng
def get_available_years(request):
    years = User.objects.annotate(year=ExtractYear('date_joined')).values_list('year', flat=True).distinct().order_by('year')
    return JsonResponse({'years': list(years)})


def user_stats_api(request):
    stat_type = request.GET.get('type')
    year = int(request.GET.get('year', 0))
    labels = []
    values = []

    if stat_type == 'year':
        data = User.objects.filter(date_joined__year__gte=year).annotate(
            year=TruncYear('date_joined')
        ).values('year').annotate(count=Count('id'))
        labels = [str(entry['year'].year) for entry in data]
        values = [entry['count'] for entry in data]

    elif stat_type == 'quarter':
        data = User.objects.filter(date_joined__year=year).annotate(
            quarter=TruncQuarter('date_joined')
        ).values('quarter').annotate(count=Count('id'))
        labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"]

        values_dict = {f"{year}-Q{quarter}": 0 for quarter in range(1, 5)}
        for entry in data:
            quarter_number = (entry['quarter'].month - 1) // 3 + 1
            quarter_str = f"{year}-Q{quarter_number}"
            values_dict[quarter_str] = entry['count']

        values = list(values_dict.values())

    elif stat_type == 'month':
        data = User.objects.filter(date_joined__year=year).annotate(
            month=TruncMonth('date_joined')
        ).values('month').annotate(count=Count('id'))
        labels = [f"Tháng {i}" for i in range(1, 13)]

        values_dict = {f"{year}-{month:02d}-01": 0 for month in range(1, 13)}
        for entry in data:
            month_str = entry['month'].strftime("%Y-%m-%d")
            values_dict[month_str] = entry['count']

        values = list(values_dict.values())

    return JsonResponse({'labels': labels, 'values': values})


def post_stats_api(request):
    stat_type = request.GET.get('type')
    year = int(request.GET.get('year', 0))
    labels = []
    values = []

    if stat_type == 'year':
        data = BaiDang.objects.filter(created_date__year__gte=year).annotate(
            year=TruncYear('created_date')
        ).values('year').annotate(count=Count('id'))
        labels = [str(entry['year'].year) for entry in data]
        values = [entry['count'] for entry in data]

    elif stat_type == 'quarter':
        data = BaiDang.objects.filter(created_date__year=year).annotate(
            quarter=TruncQuarter('created_date')
        ).values('quarter').annotate(count=Count('id'))
        labels = ["Q1", "Q2", "Q3", "Q4"]

        values_dict = {f"{year}-Q{quarter}": 0 for quarter in range(1, 5)}
        for entry in data:
            quarter_number = (entry['quarter'].month - 1) // 3 + 1
            quarter_str = f"{year}-Q{quarter_number}"
            values_dict[quarter_str] = entry['count']

        values = list(values_dict.values())

    elif stat_type == 'month':
        data = BaiDang.objects.filter(created_date__year=year).annotate(
            month=TruncMonth('created_date')
        ).values('month').annotate(count=Count('id'))
        labels = [f"Tháng {i}" for i in range(1, 13)]

        values_dict = {f"{year}-{month:02d}-01": 0 for month in range(1, 13)}
        for entry in data:
            month_str = entry['month'].strftime("%Y-%m-%d")
            values_dict[month_str] = entry['count']

        values = list(values_dict.values())

    return JsonResponse({'labels': labels, 'values': values})