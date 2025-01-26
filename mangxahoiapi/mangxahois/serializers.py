from rest_framework import serializers
from .models import User, BaiDang, BinhLuan, Reaction, CauHoi, LuaChon, KhaoSat, TraLoi, ThongBaoSuKien


class UserSerializer(serializers.ModelSerializer):
    tuongTac = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all()
    )

    class Meta:
        model = User
        fields = ['id', 'password', 'email', 'username', 'first_name', 'last_name', 'SDT', 'image', 'vaiTro', 'tuongTac']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        tuong_tac_data = validated_data.pop('tuongTac', None)
        password = validated_data.pop('password', None)

        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()

        if tuong_tac_data:
            user.tuongTac.set(tuong_tac_data)

        return user


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'SDT']


class BaiDangSerializer(serializers.ModelSerializer):

    class Meta:
        model = BaiDang
        fields = ['id', 'tieuDe', 'thongTin', 'nguoiDangBai', 'created_date', 'updated_date', 'khoa_binh_luan']


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

    class Meta:
        model = KhaoSat
        fields = ['id', 'tieuDe', 'moTa', 'nguoiTao', 'created_date', 'is_active', 'cauhois']

# Serializer cho câu trả lời của người dùng
class TraLoiSerializer(serializers.ModelSerializer):

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
    class Meta:
        model = ThongBaoSuKien
        fields = ['id', 'tieuDe', 'noiDung', 'nguoiGui', 'nhomNhan', 'ngay_gui']