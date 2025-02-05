from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from rest_framework import viewsets, generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework import status, permissions
from django.http import JsonResponse
from django.db.models import Count
from django.db.models.functions import TruncYear, TruncQuarter, TruncMonth, ExtractYear

from .models import User, BaiDang, BinhLuan, Reaction, TraLoi, KhaoSat, CauHoi, LuaChon, ThongBaoSuKien, ReactionType, VaiTro
from .serializers import (
    UserSerializer, BaiDangSerializer, BinhLuanSerializer, ReactionSerializer, TraLoiSerializer, KhaoSatSerializer,
    CauHoiSerializer, LuaChonSerializer, ThongBaoSuKienSerializer
)


# ViewSet cho User
class UserViewSet(viewsets.ModelViewSet,
                   generics.ListAPIView,
                   generics.CreateAPIView,  #post
                   generics.RetrieveAPIView):#get
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser]

    # API đổi mật khẩu trong ViewSet
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path="change-password")
    def change_password(self, request):
        user = request.user
        data = request.data

        # Kiểm tra mật khẩu cũ
        if not check_password(data.get('old_password'), user.password):
            return Response({"message": "Mật khẩu cũ không đúng"}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra mật khẩu mới hợp lệ
        if len(data.get('new_password')) < 3:
            return Response({"message": "Mật khẩu mới phải có ít nhất 3 ký tự"}, status=status.HTTP_400_BAD_REQUEST)

        # Đổi mật khẩu
        user.set_password(data.get('new_password'))
        user.password_changed = True  # ✅ Đánh dấu đã đổi mật khẩu
        user.save()

        return Response({"message": "Mật khẩu đã được thay đổi thành công"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser], url_path="unlock-account")
    def unlock_account(self, request, pk=None):
        """Admin mở khóa tài khoản giảng viên bị khóa"""
        user = get_object_or_404(User, pk=pk)

        if user.is_active:
            return Response({"message": "Tài khoản này đã được kích hoạt."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.manually_unlocked = True
        user.save()

        return Response({"message": f"Tài khoản {user.username} đã được mở khóa."}, status=status.HTTP_200_OK)


    # b 22/01
    def get_permissions(self):
        if self.action in ['get_current_user']:
            return [permissions.IsAuthenticated()]

        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='current-user', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        user = request.user

        # Kiểm tra nếu là giảng viên, chưa đổi mật khẩu và đã quá 30 giây
        if user.vaiTro == VaiTro.GIANGVIEN and not user.password_changed and not user.manually_unlocked:
            elapsed_time = (now() - user.created_at).total_seconds()
            if elapsed_time > 30:
                user.is_active = False  # Vô hiệu hóa tài khoản
                user.manually_unlocked = False
                user.save()
                return Response({"message": "Tài khoản của bạn đã bị vô hiệu hóa do không đổi mật khẩu kịp thời."},
                                status=status.HTTP_403_FORBIDDEN)

        return Response(UserSerializer(user).data)


# ViewSet cho BaiDang
class BaiDangViewSet(viewsets.ModelViewSet):
    queryset = BaiDang.objects.all().order_by('-created_date')
    serializer_class = BaiDangSerializer

    @action(methods=['post'], detail=True, url_path="khoa-binh-luan", url_name="khoa_binh_luan")
    def khoa_binh_luan(self, request, pk=None):
        try:
            baidang = BaiDang.objects.get(pk=pk)
            baidang.khoa_binh_luan = not baidang.khoa_binh_luan
            baidang.save()
            return Response({"message": "Bình luận đã bị khóa."}, status=status.HTTP_200_OK)
        except BaiDang.DoesNotExist:
            return Response({"error": "Bài viết không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['get'], detail=True, url_path="tong-luot-tuong-tac", url_name="tong_luot_tuong_tac")
    def tong_luot_tuong_tac(self, request, pk=None):
        """ API trả về tổng lượt tương tác của bài đăng """
        baidang = get_object_or_404(BaiDang, pk=pk)
        return Response({
            "tong_luot_tuong_tac": baidang.tong_luot_tuong_tac(),
            "tong_luot_like": baidang.tong_luot_like(),
            "tong_luot_love": baidang.tong_luot_love(),
            "tong_luot_haha": baidang.tong_luot_haha()
        }, status=status.HTTP_200_OK)

# ViewSet cho BinhLuan
class BinhLuanViewSet(viewsets.ModelViewSet):
    queryset = BinhLuan.objects.all()
    serializer_class = BinhLuanSerializer




# ViewSet cho Reaction (Like, Haha, Love)
class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer

    def create(self, request, *args, **kwargs):
        """ API cho phép thêm/cập nhật cảm xúc của người dùng đối với bài đăng """
        bai_dang = get_object_or_404(BaiDang, pk=request.data.get('baiDang'))
        loai = request.data.get('loai')

        if loai not in [ReactionType.LIKE.value, ReactionType.LOVE.value, ReactionType.HAHA.value]:
            return Response({"error": "Loại cảm xúc không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        reaction, created = Reaction.objects.get_or_create(
            baiDang=bai_dang,
            nguoiThucHien=request.user,
            defaults={'loai': loai}
        )

        if not created:
            reaction.loai = loai
            reaction.save()

        return Response({"message": "Cảm xúc đã được cập nhật."}, status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=True, url_path="xoa-tuong-tac", url_name="xoa_tuong_tac")
    def delete_reaction(self, request, pk=None):
        """ API xóa cảm xúc của người dùng đối với bài đăng """
        reaction = get_object_or_404(Reaction, pk=pk, nguoiThucHien=request.user)
        reaction.delete()
        return Response({"message": "Cảm xúc đã bị xóa."}, status=status.HTTP_204_NO_CONTENT)

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
    permission_classes = [permissions.AllowAny]  # Không yêu cầu đăng nhập

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