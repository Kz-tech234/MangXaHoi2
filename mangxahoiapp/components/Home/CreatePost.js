import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import APIs, { endpoints } from "../../configs/APIs";

const CreatePost = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    try {
      await APIs.post(endpoints["create_baidang"], {
        tieuDe: title,
        noiDung: content,
      });
      Alert.alert("Thành công", "Bài đăng đã được tạo!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo bài đăng!");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tiêu đề</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề..." />
      
      <Text style={styles.label}>Nội dung</Text>
      <TextInput style={styles.input} value={content} onChangeText={setContent} placeholder="Nhập nội dung..." multiline />

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
