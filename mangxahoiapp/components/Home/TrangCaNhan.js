
import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Button } from "react-native";
import { MyUserContext, MyDispatchContext } from "../../configs/MyUserContext"; // Import context
import axios from "axios";
import { Ionicons } from 'react-native-vector-icons'; // Import icon

const TrangCaNhan = ({ route, navigation }) => {
  const { userId } = route.params;
  const userLogin = useContext(MyUserContext); // Lấy thông tin người dùng đăng nhập
  const dispatch = useContext(MyDispatchContext); // Lấy dispatch để cập nhật dữ liệu người dùng
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userTuongTac, setUserTuongTac] = useState([]); // State lưu danh sách tuongTac từ API

  const API_URL = "https://chickenphong.pythonanywhere.com"; // API URL chính

  const getVaiTroName = (vaiTro) => {
    if (vaiTro === 1) return "Quản trị viên";
    else if (vaiTro === 2) return "Giảng viên";
    else if (vaiTro === 3) return "Cựu sinh viên";
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const userLoginTmp = { ...userLogin, id: userLogin.id };

    // Lấy dữ liệu người dùng từ API
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      }
    };

    // Lấy bài viết của người dùng
    const fetchUserPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/baidangs/`);
        const filteredPosts = response.data.filter(post => post.nguoiDangBai === userId);
        setUserPosts(filteredPosts);
      } catch (error) {
        console.error("Error fetching user posts:", error.message);
      }
    };

    // Lấy danh sách tương tác của người dùng
    const fetchTuongTacData = async () => {
      try {
        if (userLoginTmp?.id) {
          const response = await axios.get(`${API_URL}/users/${userLoginTmp.id}`);
          setUserTuongTac(response.data.tuongTac || []);
          
          // Kiểm tra nếu người dùng đã theo dõi
          if (response.data.tuongTac && response.data.tuongTac.includes(userId)) {
            setIsFollowing(true);
          } else {
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error("Error fetching tuongTac data:", error.message);
      }
    };

    // Gọi các hàm trên khi có sự thay đổi userId hoặc userLogin
    fetchUserData();
    fetchUserPosts();
    fetchTuongTacData();

  }, [userId, userLogin.id]);

  const handleFollow = async () => {
    try {
      const updatedTuongTac = [...userTuongTac, userId];
      setIsFollowing(true);

      const formData = new FormData();
      updatedTuongTac.forEach(id => formData.append('tuongTac', id));

      await axios.patch(`${API_URL}/users/${userLogin.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer yourAccessToken`,
        },
      });

      setUserTuongTac(updatedTuongTac);
      console.log("Cập nhật thành công");
    } catch (error) {
      setIsFollowing(false);
      console.error("Lỗi khi cập nhật:", error.message);
    }
  };

  const handleUnfollow = async () => {
    try {
      const updatedTuongTac = userTuongTac.filter(item => item !== userId);
      setIsFollowing(false);

      const formData = new FormData();
      updatedTuongTac.forEach(id => formData.append('tuongTac', id));

      await axios.patch(`${API_URL}/users/${userLogin.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer yourAccessToken`,
        },
      });

      setUserTuongTac(updatedTuongTac);
      console.log("Successfully unfollowed");
    } catch (error) {
      setIsFollowing(true);
      console.error("Error unfollowing user:", error.message);
    }
  };

  const handleMessage = () => {
    navigation.navigate("ChatScreen", { recipientId: userId, recipientName: userData.first_name });
  };

  return (
    <ScrollView style={styles.container}>
      {userData ? (
        <>
          <View style={styles.coverContainer}>
            <Image
              source={userData.coverImage ? { uri: `https://chickenphong.pythonanywhere.com${user.coverImage}` } : require("../../assets/anh3.jpg")}
              style={styles.coverImage}
            />
            <View style={styles.profileHeader}>
              <Image
                source={userData.image ? { uri: `${API_URL}${userData.image}` } : null}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {userData.last_name} {userData.first_name}
                </Text>
                <Text style={styles.profileUsername}>@{userData.username}</Text>
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Thông tin liên hệ</Text>
            <Text style={styles.contactText}>Số điện thoại: {userData.SDT}</Text>
            <Text style={styles.contactText}>Email: {userData.email}</Text>
            <Text style={styles.contactText}>Vai trò: {getVaiTroName(userData.vaiTro)}</Text>
            <Text style={styles.contactText}>Ngày tham gia: {formatDate(userData.date_joined)}</Text>
          </View>

          {userLogin.id !== userId && (
            <View style={styles.followButtonContainer}>
              {isFollowing ? (
                <>
                  <TouchableOpacity onPress={handleUnfollow} style={styles.button}>
                    <Ionicons name="person-remove" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Hủy theo dõi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleMessage} style={[styles.button, styles.messageButton]}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Nhắn tin</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleFollow} style={styles.button}>
                  <Ionicons name="person-add" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Theo dõi</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.postsTitle}>Bài viết của {userData.first_name}:</Text>

          {userPosts.length > 0 ? (
            userPosts.slice().reverse().map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postItem}
                onPress={() => navigation.navigate('ChiTietBaiDang', { baiDang: post })}
              >
                <Text style={styles.postTitle}>{post.tieuDe}</Text>
                <Text style={styles.postDate}>
                  Ngày đăng: {new Date(post.created_date).toLocaleString("vi-VN")}
                </Text>
                <View style={styles.postContent}>
                  <Text style={styles.postInfo}>{post.thongTin.replace(/<[^>]+>/g, '')}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noPostsText}>Người dùng này chưa đăng bài viết nào.</Text>
          )}
        </>
      ) : (
        <Text>Đang tải thông tin người dùng...</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  coverContainer: {
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    paddingHorizontal: 15,
  },
  profileImage: {
    marginTop: -20,
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#ccc",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  profileUsername: {
    fontSize: 16,
    color: "#0288d1",
    marginTop: 5,
  },
  contactInfo: {
    marginTop: 20,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0288d1",
  },
  contactText: {
    fontSize: 16,
    color: "#888",
    marginTop: 5,
  },
  followButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0288d1',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  messageButton: {
    backgroundColor: '#388E3C',
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    color: "#0288d1",
  },
  postItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    paddingLeft: 15,
    paddingRight: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  postContent: {
    marginTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  postInfo: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
    lineHeight: 20,
  },
  postDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  noPostsText: {
    fontSize: 16,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default TrangCaNhan;
