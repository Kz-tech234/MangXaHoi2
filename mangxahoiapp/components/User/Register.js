import { useState } from "react";
import { 
    Alert, Image, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View, ScrollView, StyleSheet
} from "react-native";
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
    const [images, setImages] = useState([]);

    const nav = useNavigation();

    const users = {
        first_name: { title: "Tên", field: "first_name", secureTextEntry: false },
        last_name: { title: "Họ và tên lót", field: "last_name", secureTextEntry: false },
        email: { title: "Email", field: "email", secureTextEntry: false },
        username: { title: "Tên đăng nhập", field: "username", secureTextEntry: false },
        password: { title: "Mật khẩu", field: "password", secureTextEntry: true },
        confirm: { title: "Xác nhận mật khẩu", field: "confirm", secureTextEntry: true },
        SDT: { title: "Số điện thoại", field: "SDT", secureTextEntry: false },
    };

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
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                setImages([{ uri: result.assets[0].uri }]);
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
        for (let key in user) {
            if (key !== 'confirm') {
                form.append(key, user[key]);
            }
        }

        if (images.length > 0) {
            form.append('image', {
                uri: images[0].uri,
                type: "image/jpeg",
                name: "avatar.jpg",
            });
        }

        setLoading(true);
        try {
            let res = await APIs.post(endpoints['register'], form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert("Đăng ký thành công", "Mời bạn đăng nhập.");
            nav.navigate("login");
        } catch (ex) {
            console.error(ex);
            Alert.alert("Đăng ký thành công", "Chờ admin duyệt để đăng nhập.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
                    <View style={styles.formContainer}>
                        <HelperText type="error" visible={err}>Mật khẩu KHÔNG khớp</HelperText>

                        {/* Ảnh đại diện */}
                        <View style={styles.avatarContainer}>
                            <Image
                                source={images.length > 0 ? { uri: images[0].uri } : require("../../assets/default-avatar.png")}
                                style={styles.avatar}
                            />
                            <TouchableOpacity onPress={handleImagePick} style={styles.pickImageButton}>
                                <Text style={styles.pickImageText}>Chọn ảnh đại diện</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form đăng ký */}
                        {Object.values(users).map(u => (
                            <TextInput
                                key={u.field}
                                secureTextEntry={u.secureTextEntry}
                                value={user[u.field]}
                                onChangeText={t => change(t, u.field)}
                                style={styles.input}
                                placeholder={u.title}
                                autoCapitalize="none"
                            />
                        ))}

                        {/* Radio chọn vai trò */}
                        <View style={styles.radioContainer}>
                            <RadioButton
                                value="3"
                                status={user.vaiTro === '3' ? 'checked' : 'unchecked'}
                                onPress={() => setUser({ ...user, vaiTro: '3' })}
                            />
                            <Text style={styles.radioText}>Cựu sinh viên</Text>
                        </View>

                        {/* Nút đăng ký */}
                        <Button loading={loading} mode="contained" onPress={register} style={styles.registerButton}>
                            Đăng ký
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollView: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
    },
    formContainer: {
        backgroundColor: "#f9f9f9",
        padding: 20,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        minHeight: 650, // Đảm bảo form đủ dài để cuộn
        marginBottom: 100, // Khoảng cách đảm bảo không bị che mất nút
    },
    input: {
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 15,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: "#007bff",
    },
    pickImageButton: {
        marginTop: 10,
        backgroundColor: "#007bff",
        padding: 8,
        borderRadius: 5,
    },
    pickImageText: {
        color: "#fff",
        fontWeight: "bold",
    },
    radioContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    radioText: {
        marginLeft: 5,
        fontSize: 16,
    },
    registerButton: {
        marginTop: 15,
        paddingVertical: 10,
    },
});

export default Register;
