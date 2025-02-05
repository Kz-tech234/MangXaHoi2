import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { Avatar, ListItem } from "react-native-elements";
import { Title, Subheading } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "react-native-vector-icons";
import APIs, { endpoints } from "../../configs/APIs";
import { MyUserContext } from "../../configs/MyUserContext"; // Lấy thông tin người dùng

const Home = () => {
  const userLogin = useContext(MyUserContext); // Lấy thông tin user hiện tại
  const [baidangs, setBaidangs] = useState([]);
  const [users, setUsers] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // 🚀 Tải danh sách bài đăng và người dùng
  const loadBaidangs = async () => {
    try {
      const res = await APIs.get(endpoints["baidangs"]);
      const sortedData = res.data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      const usersData = {};
      for (const baiDang of sortedData) {
        if (!usersData[baiDang.nguoiDangBai]) {
          const userRes = await APIs.get(`/users/${baiDang.nguoiDangBai}`);
          usersData[baiDang.nguoiDangBai] = userRes.data;
        }
      }

      setBaidangs(sortedData);
      setUsers(usersData);
    } catch (error) {
      console.error("Lỗi khi tải bài đăng:", error);
    }
  };

  useEffect(() => {
    loadBaidangs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBaidangs();
    setRefreshing(false);
  };

  // ✅ Hàm xóa bài đăng (Chỉ Admin mới thấy)
  const handleDeletePost = async (baiDangId) => {
    Alert.alert(
      "Xóa bài đăng",
      "Bạn có chắc chắn muốn xóa bài đăng này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await APIs.delete(`${endpoints["baidangs"]}/${baiDangId}/`);
              Alert.alert("Thành công", "Bài đăng đã được xóa.");
              loadBaidangs(); // Cập nhật lại danh sách bài đăng
            } catch (error) {
              console.error("Lỗi khi xóa bài đăng:", error);
              Alert.alert("Lỗi", "Không thể xóa bài đăng.");
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (baiDang) => {
    if (userLogin?.vaiTro === 1) { // Kiểm tra nếu user là Admin
      Alert.alert(
        "Tùy chọn bài đăng",
        "Bạn muốn làm gì với bài đăng này?",
        [
          {
            text: "Xóa bài đăng",
            onPress: () => handleDeletePost(baiDang.id),
            style: "destructive", // Nút xóa màu đỏ
          },
          {
            text: "Hủy",
            style: "cancel",
          },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Bài đăng</Text>
        <Ionicons name="search" size={30} color="#0288d1" style={styles.searchIcon} onPress={() => navigation.navigate("TimNguoiKhac")} />
        <Ionicons name="add-circle" size={30} color="#0288d1" style={styles.addIcon} onPress={() => navigation.navigate("CreatePost")} />
      </View>

      {baidangs.length === 0 ? (
        <Text style={styles.noPostText}>Không có bài đăng nào.</Text>
      ) : (
        baidangs.map((b) => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.6}
            delayLongPress={300} // Cảm giác giữ lâu hơn 0.3s mới hiện menu
            onLongPress={() => handleLongPress(b)}
            onPress={() => navigation.navigate("ChiTietBaiDang", { baiDang: b })}
          >
            <ListItem bottomDivider>
              <Avatar
                rounded
                size="medium"
                source={users[b.nguoiDangBai]?.image ? { uri: `https://chickenphong.pythonanywhere.com${users[b.nguoiDangBai].image}` } : null}
              />
              <ListItem.Content>
                <View style={styles.postHeader}>
                  <Title>{users[b.nguoiDangBai]?.last_name} {users[b.nguoiDangBai]?.first_name}</Title>
                </View>
                <Subheading style={styles.subtitle}>{b.tieuDe}</Subheading>
                <Text style={styles.date}>Ngày đăng: {new Date(b.created_date).toLocaleString("vi-VN")}</Text>
              </ListItem.Content>
            </ListItem>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  addIcon: {
    marginLeft: 10,
  },
  subtitle: {
    color: "#555",
    marginTop: 5,
  },
  date: {
    color: "#888",
    fontSize: 12,
    marginTop: 5,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  noPostText: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginTop: 20,
  },
});

export default Home;
