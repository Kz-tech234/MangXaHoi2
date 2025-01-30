import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import APIs, { endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyUserContext"; 

const CreatePost = ({ navigation }) => {
  const user = useContext(MyUserContext); // Lấy thông tin user hiện tại
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  console.log("User Context:", user); // Debug để kiểm tra giá trị user

  if (!user || !user.id) {
    Alert.alert("Lỗi", "Bạn chưa đăng nhập!");
    return null;
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    try {
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem("token");

      // Kiểm tra nếu không có token
      if (!token) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập!");
        return;
      }

      // Gửi request lên API
      const response = await APIs.post(
        endpoints["baidangs"],
        {
          tieuDe: title,
          thongTin: content,
          nguoiDangBai: user.id, // Đảm bảo user.id hợp lệ
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Truyền token vào header
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert("Thành công", "Bài đăng đã được tạo!");
      navigation.goBack();
    } catch (error) {
      console.error("Lỗi tạo bài đăng:", error);

      if (error.response) {
        console.error("Lỗi từ API:", error.response.data);
        Alert.alert("Lỗi", error.response.data.message || "Không thể tạo bài đăng!");
      } else {
        Alert.alert("Lỗi", "Lỗi không xác định, vui lòng thử lại!");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tiêu đề</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Nhập tiêu đề..."
      />
      
      <Text style={styles.label}>Nội dung</Text>
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        placeholder="Nhập nội dung..."
        multiline
      />

      <Button title="Đăng bài" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

export default CreatePost;
