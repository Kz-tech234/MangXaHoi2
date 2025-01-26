import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import { View } from "react-native";
import { Button, Icon, TextInput, Text } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import axios from 'axios';
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { MyDispatchContext } from "../../configs/MyUserContext";
import { useNavigation } from "@react-navigation/native";

const Login = () => {
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();

    const change = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const users = {
        "username": {
            "title": "Tên đăng nhập",
            "field": "username",
            "icon": "text",
            "secureTextEntry": false
        }, "password": {
            "title": "Mật khẩu",
            "field": "password",
            "icon": "eye",
            "secureTextEntry": true
        }
    };

    const login = async () => {
        setLoading(true);
        try {
            let res = await APIs.post(endpoints['login'], {
                ...user,
                client_id: 'sIOM66N4VUPsvJzKqcfWrxKLn7Rbzg5imLa3c3mi',
                client_secret: '123456',
                grant_type: 'password',
            },{
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            console.info(res.data);
            await AsyncStorage.setItem('token', res.data.access_token);
    
            // Không cần setTimeout, điều hướng trực tiếp khi dữ liệu người dùng đã được tải xong
            let userRes = await authApis(res.data.access_token).get(endpoints['current-user']);
            console.info(userRes.data);
    
            dispatch({
                "type": "login",
                "payload": userRes.data
            });
    
            // Điều hướng đến "home" ngay lập tức sau khi hoàn tất
            nav.navigate("home");
    
        } catch (err) {
            if (err.response) {
                console.error("Response Error:", err.response.data);
            } else if (err.request) {
                console.error("Request Error:", err.request);
            } else {
                console.error("Error Message:", err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={MyStyles.container}>
            <Text style={MyStyles.title}>Đăng nhập</Text>
            {Object.values(users).map(u => (
                <TextInput 
                    secureTextEntry={u.secureTextEntry} 
                    key={u.field} 
                    value={user[u.field]} 
                    onChangeText={t => change(t, u.field)} 
                    style={MyStyles.margin} 
                    placeholder={u.title} 
                    right={<TextInput.Icon icon={u.icon} />} 
                />
            ))}
            <Button loading={loading} mode="contained" onPress={login}>ĐĂNG NHẬP</Button>
        </View>
    );
};

export default Login;
