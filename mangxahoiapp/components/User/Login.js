import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { MyDispatchContext } from "../../configs/MyUserContext";
import { useNavigation } from "@react-navigation/native";

const Login = () => {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const dispatch = useContext(MyDispatchContext);
    const navigation = useNavigation();

    const change = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const users = {
        "username": {
            "title": "Tên đăng nhập",
            "field": "username",
            "icon": "account",
            "secureTextEntry": false
        },
        "password": {
            "title": "Mật khẩu",
            "field": "password",
            "icon": "lock",
            "secureTextEntry": true
        }
    };

    const login = async () => {
        setLoading(true);
        try {
            let res = await APIs.post(endpoints['login'], {
                ...user,
                client_id: 'Bww8cW4mr7X0tGV45Hkdkawc9RAsX90sfPwFL9Kj',
                client_secret: '123456',
                grant_type: 'password',
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            await AsyncStorage.setItem('token', res.data.access_token);

            setTimeout(async () => {
                let user = await authApis(res.data.access_token).get(endpoints['current-user']);
                dispatch({
                    "type": "login",
                    "payload": user.data
                });

            }, 100);

        } catch (err) {
            Alert.alert("Lỗi đăng nhập", "Sai tên đăng nhập hoặc mật khẩu!");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Đăng nhập</Text>

                    {Object.values(users).map((u) => (
                        <TextInput
                            key={u.field}
                            secureTextEntry={u.secureTextEntry}
                            value={user[u.field]}
                            onChangeText={(t) => change(t, u.field)}
                            style={styles.input}
                            placeholder={u.title}
                            mode="outlined"
                            left={<TextInput.Icon icon={u.icon} />}
                        />
                    ))}

                    <Button 
                        mode="contained" 
                        loading={loading} 
                        onPress={login} 
                        style={styles.loginButton}
                    >
                        ĐĂNG NHẬP
                    </Button>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 20,
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
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: "#007bff",
        marginBottom: 20,
    },
    input: {
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    loginButton: {
        marginTop: 10,
        paddingVertical: 8,
    },
});

export default Login;
