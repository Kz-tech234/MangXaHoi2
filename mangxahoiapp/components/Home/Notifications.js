import React, { useState, useEffect, useContext } from "react";
import { 
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Button, 
  TextInput, Alert, TouchableOpacity 
} from "react-native";
import APIs, { endpoints } from "../../configs/APIs";
import { ListItem } from "react-native-elements";
import { decode } from 'html-entities';
import { MyUserContext } from "../../configs/MyUserContext";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from "react-native-modal";

const Notifications = () => {
  const { user } = useContext(MyUserContext); // Lấy thông tin người dùng
  console.log("User Data:", user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  useEffect(() => {
    loadNotifications();
    if (user?.vaiTro === 1) { // Nếu là Quản trị viên, tải danh sách Cựu sinh viên
      loadRecipients();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      console.log("Fetching notifications...");
      const res = await APIs.get(endpoints["thongbaosukiens"]);
      console.log("API Response:", res.data);
      setNotifications(res.data);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      setError("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      console.log("Fetching recipients...");
      const res = await APIs.get(endpoints["users"]);
      const filteredUsers = res.data.filter(user => user.vaiTro === 3 && user.is_active);
      setRecipients(filteredUsers);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người nhận:", error);
    }
  };

  const handleCreateNotification = async () => {
    if (!title || !content || selectedRecipients.length === 0) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      const payload = {
        tieuDe: title,
        noiDung: content,
        nguoiGui: user.id, // Gửi từ quản trị viên
        nhomNhan: selectedRecipients.map(u => u.id),
      };

      await APIs.post(endpoints["thongbaosukiens"], payload);
      Alert.alert("Thành công", "Thông báo đã được tạo.");
      setTitle("");
      setContent("");
      setSelectedRecipients([]);
      setModalVisible(false);
      loadNotifications(); // Cập nhật danh sách thông báo
    } catch (error) {
      console.error("Lỗi khi tạo thông báo:", error);
      Alert.alert("Lỗi", "Không thể tạo thông báo.");
    }
  };

  const toggleSelectRecipient = (user) => {
    setSelectedRecipients((prev) => 
      prev.some(u => u.id === user.id) 
        ? prev.filter(u => u.id !== user.id) 
        : [...prev, user]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {user && user.vaiTro === 1 && (
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Icon name="plus-circle" size={50} color="#0288d1" />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.container}>
        <Text style={styles.header}>Thông Báo</Text>

        {loading && <ActivityIndicator size="large" color="#0288d1" />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && notifications.length === 0 && <Text style={styles.emptyText}>Không có thông báo nào.</Text>}

        {notifications.map((item) => (
          <ListItem key={item.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.title}>{item.tieuDe || "Không có tiêu đề"}</ListItem.Title>
              <ListItem.Subtitle style={styles.subtitle}>
                {item.noiDung ? decode(item.noiDung) : "Không có nội dung"}
              </ListItem.Subtitle>
              <Text style={styles.date}>
                {item.ngay_gui ? new Date(item.ngay_gui).toLocaleString("vi-VN") : "Không có ngày"}
              </Text>
            </ListItem.Content>
          </ListItem>
        ))}
      </ScrollView>

      {/* Modal Form Tạo Thông Báo */}
      <Modal isVisible={modalVisible}>
        <View style={styles.modalContainer}>
          <Text style={styles.createHeader}>Tạo Thông Báo</Text>

          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề..." />

          <Text style={styles.label}>Nội dung</Text>
          <TextInput style={styles.input} value={content} onChangeText={setContent} placeholder="Nhập nội dung..." multiline />

          <Text style={styles.label}>Chọn Người Nhận</Text>
          <Button title="Chọn tất cả" onPress={() => setSelectedRecipients(recipients)} />
          {recipients.map((user) => (
            <TouchableOpacity key={user.id} style={styles.checkboxContainer} onPress={() => toggleSelectRecipient(user)}>
              <Text>{user.username}</Text>
              <Text>{selectedRecipients.some(u => u.id === user.id) ? "✅" : "⬜"}</Text>
            </TouchableOpacity>
          ))}

          <Button title="Hoàn Thành" onPress={handleCreateNotification} />
          <Button title="Hủy" color="red" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  emptyText: { textAlign: "center", marginTop: 20, color: "gray" },
  errorText: { textAlign: "center", marginTop: 20, color: "red", fontSize: 16 },
  title: { fontSize: 16, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#555" },
  date: { fontSize: 12, color: "#888", marginTop: 5 },
  addButton: { position: "absolute", bottom: 20, right: 20, zIndex: 10 },
  modalContainer: { backgroundColor: "white", padding: 20, borderRadius: 10 },
  createHeader: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginBottom: 10 },
  checkboxContainer: { flexDirection: "row", justifyContent: "space-between", padding: 10 },
});

export default Notifications;
