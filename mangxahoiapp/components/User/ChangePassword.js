import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyUserContext";

const ChangePassword = ({ navigation }) => {
  const user = useContext(MyUserContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
  
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token"); // Lấy token từ AsyncStorage
  
      const response = await axios.post(
        `https://chickenphong.pythonanywhere.com/users/change-password/`,
        JSON.stringify({  // 🔥 Đảm bảo dữ liệu gửi lên là JSON hợp lệ
          old_password: currentPassword,
          new_password: newPassword,
        }),
        {
          headers: {
            "Content-Type": "application/json", //  Định dạng phải là JSON
            "Authorization": `Bearer ${token}`, //  Thêm token xác thực
          },
        }
      );
  
      if (response.status === 200) {
        Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công!");
        navigation.goBack(); // Quay về trang tài khoản sau khi đổi thành công
      }
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      if (error.response) {
        Alert.alert("Lỗi", `Không thể thay đổi mật khẩu: ${error.response.data.message || "Lỗi không xác định."}`);
      } else {
        Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thay đổi mật khẩu</Text>
      <TextInput
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label="Mật khẩu mới"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={handleChangePassword} loading={loading} style={styles.button}>
        Lưu thay đổi
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});

export default ChangePassword;
