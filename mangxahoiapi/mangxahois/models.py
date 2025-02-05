from django.core.exceptions import ValidationError
from django.db import models
from ckeditor.fields import RichTextField
from django.contrib.auth.models import AbstractUser
from enum import IntEnum
from cloudinary.models import CloudinaryField
from django.utils.timezone import now


class VaiTro(IntEnum):
    QUANTRIVIEN = 1
    GIANGVIEN = 2
    CUUSINHVIEN = 3

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

class User(AbstractUser):
    SDT = models.CharField(max_length=10)
    # image = CloudinaryField('avatar', null=True)
    image = models.ImageField(upload_to='media/nguoidungs/%Y/%m/', null=True)
    coverImage = models.ImageField(upload_to='media/cover_images/%Y/%m/', null=True, blank=True)
    vaiTro = models.IntegerField(choices=VaiTro.choices(), default=VaiTro.QUANTRIVIEN)
    tuongTac = models.ManyToManyField("self", symmetrical=False, related_name="tuong_tac")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Thời gian tạo tài khoản
    password_changed = models.BooleanField(default=False)  # Giảng viên đã đổi mật khẩu chưa?
    manually_unlocked = models.BooleanField(default=False)  # Đánh dấu admin đã mở khóa

    class Meta:
        verbose_name_plural = 'Người dùng'

    def save(self, *args, **kwargs):
        # Chỉ kiểm tra khi tạo tài khoản mới
        if self._state.adding:
            if self.vaiTro == VaiTro.CUUSINHVIEN:
                self.is_active = False  # Chờ xét duyệt
            elif self.vaiTro == VaiTro.GIANGVIEN:
                self.is_active = True  # Giảng viên được kích hoạt ngay lập tức
                self.password_changed = False  # Đánh dấu chưa đổi mật khẩu
            else:
                self.is_active = True  # Mặc định kích hoạt cho Quản trị viên

        super().save(*args, **kwargs)

class BaiDang(models.Model):
    tieuDe = models.CharField(max_length=255)
    thongTin = RichTextField()
    nguoiDangBai = models.ForeignKey(User, on_delete=models.CASCADE)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    khoa_binh_luan = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Bài đăng'

    def __str__(self):
        return self.tieuDe

    def tong_luot_tuong_tac(self):
        return self.reactions.count()

    def tong_luot_like(self):
        return self.reactions.filter(loai=ReactionType.LIKE.value).count()

    def tong_luot_love(self):
        return self.reactions.filter(loai=ReactionType.LOVE.value).count()

    def tong_luot_haha(self):
        return self.reactions.filter(loai=ReactionType.HAHA.value).count()

class BinhLuan(models.Model):
    baiDang = models.ForeignKey(BaiDang, on_delete=models.CASCADE, related_name='binhluans')
    nguoiBinhLuan = models.ForeignKey(User, on_delete=models.CASCADE)
    noiDung = models.TextField()
    created_date = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.baiDang.khoa_binh_luan:
            raise ValidationError("Bình luận không được phép vì bài đăng đã bị khóa bình luận.")
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = 'Bình luận'

class ReactionType(IntEnum):
    LIKE = 1
    HAHA = 2
    LOVE = 3

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]

class Reaction(models.Model):
    baiDang = models.ForeignKey(BaiDang, on_delete=models.CASCADE, related_name='reactions')
    nguoiThucHien = models.ForeignKey(User, on_delete=models.CASCADE)
    loai = models.IntegerField(choices=ReactionType.choices())

    class Meta:
        verbose_name_plural = 'Cảm xúc'
        unique_together = ('baiDang', 'nguoiThucHien')

    def __str__(self):
        return f"{self.nguoiThucHien.username} reacted {self.get_loai_display()} on {self.baiDang.tieuDe}"

class KhaoSat(models.Model):
    tieuDe = models.CharField(max_length=255)
    moTa = RichTextField()
    nguoiTao = models.ForeignKey(User, on_delete=models.CASCADE)
    created_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Khảo sát'

    def __str__(self):
        return self.tieuDe

class CauHoi(models.Model):
    khaoSat = models.ForeignKey(KhaoSat, on_delete=models.CASCADE, related_name='cauhois')
    noiDung = models.CharField(max_length=255)

    class Meta:
        verbose_name_plural = 'Câu hỏi khảo sát'

    def __str__(self):
        return self.noiDung

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Kiểm tra nếu câu hỏi chưa có lựa chọn nào thì thêm mặc định "Có" và "Không"
        if not self.luachons.exists():
            LuaChon.objects.bulk_create([
                LuaChon(cauHoi=self, noiDung="Có"),
                LuaChon(cauHoi=self, noiDung="Không")
            ])

class LuaChon(models.Model):
    cauHoi = models.ForeignKey(CauHoi, on_delete=models.CASCADE, related_name='luachons')
    noiDung = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Lựa chọn câu hỏi'

    def __str__(self):
        return self.noiDung

class TraLoi(models.Model):
    khaoSat = models.ForeignKey(KhaoSat, on_delete=models.CASCADE, related_name='traloi')
    nguoiTraLoi = models.ForeignKey(User, on_delete=models.CASCADE)
    cauHoi = models.ForeignKey(CauHoi, on_delete=models.CASCADE)
    luaChon = models.ForeignKey(LuaChon, on_delete=models.CASCADE)

    class Meta:
        verbose_name_plural = 'Trả lời khảo sát'
        unique_together = ('nguoiTraLoi', 'cauHoi')

    def clean(self):
        """ Đảm bảo lựa chọn phải là Có hoặc Không """
        if self.luaChon.noiDung not in ['Có', 'Không']:
            raise ValidationError("Chỉ có thể chọn 'Có' hoặc 'Không'")

class ThongKeKhaoSat(models.Model):
    khaoSat = models.ForeignKey('KhaoSat', on_delete=models.CASCADE, verbose_name="Khảo sát")
    ngay_thong_ke = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Thống kê khảo sát"

    def __str__(self):
        return f"Thống kê cho {self.khaoSat.tieuDe} - {self.ngay_thong_ke}"

class ThongBaoSuKien(models.Model):
    tieuDe = models.CharField(max_length=255)
    noiDung = RichTextField()
    nguoiGui = models.ForeignKey(User, on_delete=models.CASCADE)
    nhomNhan = models.ManyToManyField(User, related_name="thong_bao_nhan")
    ngay_gui = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Thông báo sự kiện'

    def __str__(self):
        return self.tieuDe