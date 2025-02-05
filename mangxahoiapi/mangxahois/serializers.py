from html import unescape

from rest_framework import serializers
import re
from .models import User, BaiDang, BinhLuan, Reaction, CauHoi, LuaChon, KhaoSat, TraLoi, ThongBaoSuKien

# Hàm loại bỏ thẻ HTML
def strip_html_tags(text):
    return re.sub(r'<.*?>', '', text) if text else text

class UserSerializer(serializers.ModelSerializer):
    tuongTac = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all()
    )

    class Meta:
        model = User
        fields = ['id', 'password', 'email', 'username', 'first_name', 'last_name', 'SDT', 'image', "coverImage", 'vaiTro', 'tuongTac','date_joined', 'password_changed', 'manually_unlocked']
        extra_kwargs = {'password': {'write_only': 'true'}}

    def create(self, validated_data):

        # b 22/01
        tuong_tac_data = validated_data.pop('tuongTac', None)
        data = validated_data.copy()
        u = User(**data)
        u.set_password(u.password)
        u.save()
        if tuong_tac_data:
            u.tuongTac.set(tuong_tac_data)  # Sang 24/1

        u.save()

    def update(self, instance, validated_data):  # Sang 24/1
        tuong_tac_data = validated_data.pop('tuongTac', None)
        password = validated_data.pop('password', None)

        if password:  # Nếu đổi mật khẩu, đánh dấu là đã đổi
            instance.set_password(password)
            instance.password_changed = True  # Đánh dấu đã đổi mật khẩu

        instance = super().update(instance, validated_data)

        if tuong_tac_data:
            instance.tuongTac.set(tuong_tac_data)

        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url if instance.image else ''
        data['coverImage'] = instance.coverImage.url if instance.coverImage else ''
        return data
    # b

class User2(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'SDT', 'image', "coverImage", 'vaiTro', 'date_joined', 'password_changed', 'manually_unlocked']

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'SDT', 'image', "coverImage", 'vaiTro', 'date_joined', 'password_changed', 'manually_unlocked']


class BaiDangSerializer(serializers.ModelSerializer):
    thongTin = serializers.CharField()

    class Meta:
        model = BaiDang
        fields = ['id', 'tieuDe', 'thongTin', 'nguoiDangBai', 'created_date', 'updated_date', 'khoa_binh_luan',
                  'tong_luot_tuong_tac', 'tong_luot_like', 'tong_luot_love', 'tong_luot_haha']

    def to_representation(self, instance):
        """Ghi đè phương thức này để xử lý dữ liệu trước khi trả về."""
        data = super().to_representation(instance)
        data['thongTin'] = strip_html_tags(unescape(data['thongTin']))  # Giải mã HTML + loại bỏ thẻ HTML
        return data



class BinhLuanSerializer(serializers.ModelSerializer):

    class Meta:
        model = BinhLuan
        fields = ['id', 'baiDang', 'nguoiBinhLuan', 'noiDung', 'created_date']


class ReactionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Reaction
        fields = ['id', 'baiDang', 'nguoiThucHien', 'loai']

# Serializer cho câu hỏi trong khảo sát
class CauHoiSerializer(serializers.ModelSerializer):
    class Meta:
        model = CauHoi
        fields = ['id', 'noiDung', 'khaoSat']

# Serializer cho lựa chọn của câu hỏi
class LuaChonSerializer(serializers.ModelSerializer):
    class Meta:
        model = LuaChon
        fields = ['id', 'cauHoi', 'noiDung', 'is_correct']

# Serializer cho khảo sát
class KhaoSatSerializer(serializers.ModelSerializer):
    moTa = serializers.SerializerMethodField()

    class Meta:
        model = KhaoSat
        fields = ['id', 'tieuDe', 'moTa', 'nguoiTao', 'created_date', 'is_active', 'cauhois']

    def get_moTa(self, obj):
        return strip_html_tags(unescape(obj.moTa))  # Giải mã HTML entities + loại bỏ thẻ HTML

# Serializer cho câu trả lời của người dùng
class TraLoiSerializer(serializers.ModelSerializer):
    luaChon = serializers.PrimaryKeyRelatedField(queryset=LuaChon.objects.all())

    class Meta:
        model = TraLoi
        fields = ['id', 'khaoSat', 'nguoiTraLoi', 'cauHoi', 'luaChon']

    def validate(self, data):
        """
        Đảm bảo lựa chọn phải thuộc về câu hỏi đã chọn
        """
        if data['luaChon'].cauHoi != data['cauHoi']:
            raise serializers.ValidationError("Lựa chọn không thuộc về câu hỏi đã chọn.")
        return data

class ThongBaoSuKienSerializer(serializers.ModelSerializer):
    noiDung = serializers.CharField()

    class Meta:
        model = ThongBaoSuKien
        fields = ['id', 'tieuDe', 'noiDung', 'nguoiGui', 'nhomNhan', 'ngay_gui']

    def to_representation(self, instance):
        """Ghi đè phương thức này để xử lý dữ liệu trước khi trả về."""
        data = super().to_representation(instance)
        data['noiDung'] = strip_html_tags(unescape(data['noiDung']))  # Giải mã HTML + loại bỏ thẻ HTML
        return data