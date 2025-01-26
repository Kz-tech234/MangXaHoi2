import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { Button, HelperText, RadioButton, TextInput } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import * as ImagePicker from 'expo-image-picker';
import APIs, { endpoints } from "../../configs/APIs";
import * as FileSystem from 'expo-file-system';
import { useNavigation } from "@react-navigation/native";

const Register = () => {
    const [user, setUser] = useState({ vaiTro: '3' });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(false);

    const users = {
        first_name: { title: "Tên", field: "first_name", secureTextEntry: false },
        last_name: { title: "Họ và tên lót", field: "last_name", secureTextEntry: false },
        email: { title: "Email", field: "email", secureTextEntry: false },
        username: { title: "Tên đăng nhập", field: "username", secureTextEntry: false },
        password: { title: "Mật khẩu", field: "password", secureTextEntry: true },
        confirm: { title: "Xác nhận mật khẩu", field: "confirm", secureTextEntry: true },
        SDT: { title: "Số điện thoại", field: "SDT", secureTextEntry: false },
    };

    const nav = useNavigation();

    const [images, setImages] = useState([]);

    const change = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const handleImagePick = async () => {
        try {
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permissionResult.status !== 'granted') {
            alert('Quyền truy cập ảnh bị từ chối');
            return;
          }
    
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });
    
          if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
            setImages([{ ...result.assets[0], base64 }]);
          } else {
            console.log('Chọn ảnh bị hủy bỏ');
          }
        } catch (error) {
          console.error('Error picking image:', error);
        }
    };

    const register = async () => {
        if (user.password !== user.confirm) {
            setErr(true);
            Alert.alert("Mật khẩu không khớp", "Vui lòng nhập lại mật khẩu.");
            return;
        }

        setErr(false);
        let form = new FormData();
            for (let key in user)
                if (key !== 'confirm') {
                    form.append(key, user[key]);
                }

            const image = images[0];
            const imageName = image.fileName || `image.jpg`; 
            const imageType = "image/jpeg";

            form.append('image', {
            uri: image.uri,
            type: imageType,
            name: imageName,
            });
        setLoading(true);
        try {
            let res = await APIs.post(endpoints['register'], form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert("Đăng ký thành công", "Mời bạn đăng nhập.");
            nav.navigate("login");
        } catch (ex) {
            console.error(ex);
            Alert.alert("Đăng ký thất bại", "Vui lòng kiểm tra lại thông tin và thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={MyStyles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <HelperText type="error" visible={err}>Mật khẩu KHÔNG khớp</HelperText>
                {Object.values(users).map(u => (
                    <TextInput
                        key={u.field}
                        secureTextEntry={u.secureTextEntry}
                        value={user[u.field]}
                        onChangeText={t => change(t, u.field)}
                        style={MyStyles.margin}
                        placeholder={u.title}
                        autoCapitalize="none"
                        right={<TextInput.Icon icon={u.icon} />}
                    />
                ))}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
                    <RadioButton
                        value="3"
                        status={user.vaiTro === '3' ? 'checked' : 'unchecked'}
                        onPress={() => setUser({ ...user, vaiTro: '3' })}
                    />
                    <Text>CUUSINHVIEN (Cựu Sinh Viên)</Text>
                </View>
                <TouchableOpacity onPress={handleImagePick}>
                    <Text style={MyStyles.margin}>Chọn ảnh đại diện...</Text>
                </TouchableOpacity>
                {images.map((image, index) => (
                          <Image key={index} source={{ uri: image.uri }} style={{ width: 100, height: 100 }} />
                        ))}
                <Button loading={loading} mode="contained" onPress={register}>ĐĂNG KÝ</Button>
            </KeyboardAvoidingView>
        </View>
    );
};

export default Register;
