import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system"; // Chuyển ảnh sang Base64
import APIs, { endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyUserContext"; 

const CreatePost = ({ navigation }) => {
  const user = useContext(MyUserContext); 
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  if (!user || !user.id) {
    Alert.alert("Lỗi", "Bạn chưa đăng nhập!");
    return null;
  }

  // 📌 Chọn ảnh từ thư viện và chuyển sang Base64
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);

      // Chuyển ảnh sang Base64
      const base64Image = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
      setImageBase64(base64Image);
    }
  };

  // 📌 Gửi bài đăng lên API
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và nội dung!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập!");
        return;
      }

      let postData = {
        tieuDe: title,
        thongTin: content,
        nguoiDangBai: user.id,
        hinhAnhBase64: imageBase64 || null, // Gửi ảnh dạng Base64 nếu có
      };

      // 📌 Gửi request lên API
      const response = await APIs.post("https://chickenphong.pythonanywhere.com/baidangs/", postData, {
        headers: {
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json", 
        },
      });

      Alert.alert("Thành công", "Bài đăng đã được tạo!");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Lỗi tạo bài đăng:", error);

      if (error.response) {
        console.error("❌ Lỗi từ API:", error.response.data);
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

      {/* 📌 Nút chọn ảnh */}
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>📷 Chọn ảnh</Text>
      </TouchableOpacity>

      {/* 📌 Hiển thị ảnh đã chọn */}
      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
      )}

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
  imagePicker: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  imagePickerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 10,
  },
});

export default CreatePost;
