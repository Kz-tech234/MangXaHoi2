from django import forms
from django.contrib import admin
from django.core.mail import send_mail
from django.http import HttpResponseRedirect, request
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import mark_safe
from .models import User, BaiDang, BinhLuan, Reaction, LuaChon, CauHoi, KhaoSat, TraLoi, ThongKeKhaoSat, VaiTro, ThongBaoSuKien


class MyAdminSite(admin.AdminSite):
    site_header = 'Hệ thống mạng xã hội'

    def get_urls(self):
        return [
            path('thongke/', self.thongke)
        ] + super().get_urls()

    def thongke(self, request):
        user_count = User.objects.count()

        return TemplateResponse(request, 'admin/thongke.html', {
            'user_count' : user_count
        })

class UserAdmin(admin.ModelAdmin):
    fields = ('username', 'password', 'email', 'first_name', 'last_name', 'SDT', 'vaiTro', 'image','avatar', 'is_active')
    list_display = ['username', 'email', 'SDT', 'vaiTro', 'is_active']
    search_fields = ['username']
    readonly_fields = ['avatar']

    def avatar(self, nguoidung):
        if nguoidung.image:
            return mark_safe(f'<img src="{nguoidung.image.url}" width="200" />')
        return "No Image"

    def save_model(self, request, obj, form, change):
        # Chỉ gán giá trị mặc định khi tạo mới người dùng
        if not change:
            if obj.vaiTro == VaiTro.QUANTRIVIEN:
                obj.is_active = True  # Mặc định kích hoạt
                obj.is_superuser = True
                obj.is_staff = True
            elif obj.vaiTro == VaiTro.GIANGVIEN:
                obj.is_active = True
                obj.is_superuser = False
                obj.is_staff = True
                default_password = "ou@123"  # Mật khẩu mặc định cho Giảng viên
            elif obj.vaiTro == VaiTro.CUUSINHVIEN:
                obj.is_active = False  # Chờ xét duyệt của admin
                obj.is_superuser = False
                obj.is_staff = False

            # Gửi email thông tin đăng nhập cho giảng viên
            if obj.vaiTro == VaiTro.GIANGVIEN:
                subject = "Thông tin tài khoản giảng viên"
                message = (
                    f"Xin chào {obj.first_name} {obj.last_name},\n\n"
                    f"Tài khoản của bạn đã được tạo thành công trên hệ thống.\n"
                    f"Thông tin đăng nhập:\n"
                    f"Username: {obj.username}\n"
                    f"Password: {default_password}\n\n"
                    f"Vui lòng đăng nhập và thay đổi mật khẩu trong vòng 24 giờ, "
                    f"nếu không tài khoản sẽ bị khóa.\n\n"
                    f"Trân trọng,\nQuản trị viên"
                )
                send_mail(subject, message, 'admin@yourdomain.com', [obj.email])

            obj.set_password(form.cleaned_data['password'])
        super().save_model(request, obj, form, change)

    def response_add(self, request, obj, post_url_continue=None):
        if "_addanother" in request.POST:
            return super().response_add(request, obj, post_url_continue)
        else:
            return HttpResponseRedirect(reverse('admin:mangxahois_user_changelist'))



class BinhLuanForm(forms.ModelForm):
    class Meta:
        model = BinhLuan
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Lọc danh sách bài đăng không bị khóa bình luận
        self.fields['baiDang'].queryset = BaiDang.objects.filter(khoa_binh_luan=False)

class BinhLuanAdmin(admin.ModelAdmin):
    form = BinhLuanForm
    list_display = ['baiDang', 'nguoiBinhLuan', 'noiDung', 'created_date']
    search_fields = ['noiDung', 'nguoiBinhLuan__username', 'baiDang__tieuDe']
    list_filter = ['created_date', 'baiDang']

    def has_delete_permission(self, request, obj=None):
        if obj and obj.nguoiBinhLuan == request.user:
            return True  # Người dùng có thể xoá comment của họ
        if obj and obj.baiDang.nguoiDangBai == request.user:
            return True  # Chủ bài viết có thể xoá comment
        return False  # Không cho phép xoá

class BinhLuanInline(admin.TabularInline):
    model = BinhLuan
    extra = 1  # Số lượng trường bình luận mặc định hiển thị
    readonly_fields = ['nguoiBinhLuan', 'noiDung', 'created_date']

class BaiDangAdmin(admin.ModelAdmin):
    list_display = ['tieuDe', 'nguoiDangBai', 'created_date', 'khoa_binh_luan_status']
    search_fields = ['tieuDe']
    list_filter = ['created_date', 'nguoiDangBai']
    actions = ['khoa_binh_luan']
    inlines = [BinhLuanInline]

    def khoa_binh_luan_status(self, obj):
        return obj.khoa_binh_luan
    khoa_binh_luan_status.boolean = True
    khoa_binh_luan_status.short_description = "Bình luận bị khóa?"

    def khoa_binh_luan(self, request, queryset):
        queryset.update(khoa_binh_luan=True)
        self.message_user(request, "Bình luận đã được khóa.")

    khoa_binh_luan.short_description = "Khóa bình luận của bài đăng"

class ReactionAdmin(admin.ModelAdmin):
    list_display = ['baiDang', 'nguoiThucHien', 'loai']
    search_fields = ['baiDang__tieuDe', 'nguoiThucHien__username']
    list_filter = ['loai']

# Inline để thêm các lựa chọn (đáp án) cho câu hỏi
class LuaChonInline(admin.TabularInline):
    model = LuaChon
    extra = 0  # Không cần thêm thêm lựa chọn mới vì đã có sẵn

# Inline để thêm câu hỏi vào khảo sát
class CauHoiInline(admin.TabularInline):
    model = CauHoi
    extra = 1
    inlines = [LuaChonInline]  # Đính kèm LuaChon vào CauHoi

# Quản lý khảo sát với phần câu hỏi và đáp án bên trong
class KhaoSatAdmin(admin.ModelAdmin):
    list_display = ['tieuDe', 'nguoiTao', 'created_date', 'is_active']
    search_fields = ['tieuDe', 'nguoiTao__username']
    list_filter = ['created_date', 'is_active']
    inlines = [CauHoiInline]

    def deactivate_surveys(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, "Khảo sát đã bị vô hiệu hóa.")

    def activate_surveys(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, "Khảo sát đã được kích hoạt.")

    actions = [deactivate_surveys, activate_surveys]

# Quản lý trả lời khảo sát

class TraLoiAdmin(admin.ModelAdmin):
    list_display = ['khaoSat', 'nguoiTraLoi', 'cauHoi', 'luaChon']
    search_fields = ['khaoSat__tieuDe', 'nguoiTraLoi__username']
    list_filter = ['khaoSat']


class ThongKeKhaoSatAdmin(admin.ModelAdmin):
    list_display = ['khaoSat', 'tong_nguoi_tham_gia', 'tong_quan_phan_hoi']
    search_fields = ['khaoSat__tieuDe']

    def tong_nguoi_tham_gia(self, obj):
        return TraLoi.objects.filter(khaoSat=obj.khaoSat).values('nguoiTraLoi').distinct().count()
    tong_nguoi_tham_gia.short_description = "Tổng số người tham gia"

    def tong_quan_phan_hoi(self, obj):
        # Lấy tất cả câu trả lời của khảo sát đã chọn
        responses = TraLoi.objects.filter(khaoSat=obj.khaoSat).values('luaChon__noiDung')
        summary = {}
        for response in responses:
            choice = response['luaChon__noiDung']
            summary[choice] = summary.get(choice, 0) + 1

        return ", ".join([f"{key}: {value}" for key, value in summary.items()])
    tong_quan_phan_hoi.short_description = "Tổng quan phản hồi"

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = "Thống kê khảo sát"
        return super().changelist_view(request, extra_context=extra_context)

class ThongBaoSuKienForm(forms.ModelForm):
    class Meta:
        model = ThongBaoSuKien
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Lọc người dùng có vai trò là CỰU SINH VIÊN
        self.fields['nhomNhan'].queryset = User.objects.filter(vaiTro=VaiTro.CUUSINHVIEN)


class ThongBaoSuKienAdmin(admin.ModelAdmin):
    form = ThongBaoSuKienForm
    list_display = ['tieuDe', 'nguoiGui', 'ngay_gui']
    search_fields = ['tieuDe', 'nguoiGui__username']
    filter_horizontal = ('nhomNhan',)

    def save_model(self, request, obj, form, change):
        # Lưu đối tượng trước để có ID
        super().save_model(request, obj, form, change)

        # Sau khi lưu, gửi email
        self.send_email_notifications(request, obj)

    def send_email_notifications(self, request, obj):
        recipient_emails = [user.email for user in obj.nhomNhan.all() if user.email]

        if recipient_emails:
            subject = f"Thông báo sự kiện: {obj.tieuDe}"
            message = (
                f"Xin chào,\n\n"
                f"Bạn đã nhận được một thông báo sự kiện mới từ hệ thống.\n\n"
                f"Nội dung sự kiện:\n"
                f"{obj.noiDung}\n\n"
                f"Vui lòng tham gia sự kiện đúng giờ.\n\n"
                f"Trân trọng,\nQuản trị viên"
            )
            try:
                send_mail(subject, message, 'admin@yourdomain.com', recipient_emails)
                self.message_user(request, "Email đã được gửi thành công.", level="INFO")
            except Exception as e:
                self.message_user(request, f"Lỗi khi gửi email: {e}", level="ERROR")
        else:
            self.message_user(request, "Không có email nào hợp lệ để gửi thông báo.", level="WARNING")

    def response_add(self, request, obj, post_url_continue=None):
        if "_addanother" in request.POST:
            return super().response_add(request, obj, post_url_continue)
        else:
            return HttpResponseRedirect(reverse('admin:mangxahois_thongbaosukien_changelist'))


admin_site = MyAdminSite(name='myadmin')
# Đăng ký các models vào trang admin
admin_site.register(User, UserAdmin)
admin_site.register(BaiDang, BaiDangAdmin)
admin_site.register(BinhLuan, BinhLuanAdmin)
admin_site.register(Reaction, ReactionAdmin)
admin_site.register(KhaoSat, KhaoSatAdmin)
admin_site.register(TraLoi, TraLoiAdmin)
admin_site.register(ThongKeKhaoSat, ThongKeKhaoSatAdmin)
admin_site.register(ThongBaoSuKien, ThongBaoSuKienAdmin)