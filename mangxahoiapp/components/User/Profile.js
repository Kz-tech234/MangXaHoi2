import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert } from "react-native";
import { MyDispatchContext, MyUserContext } from "../../configs/MyUserContext";
import MyStyles from "../../styles/MyStyles";
import { Button, IconButton, Menu, Provider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const Profile = ({ route, navigation }) => {
  const user = useContext(MyUserContext);
  const [userPosts, setUserPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  // Khởi tạo coverImage từ user nếu có; nếu server trả về đường dẫn tương đối, ghép domain ở đây
  const [coverImage, setCoverImage] = useState(
    user?.coverImage ? `https://chickenphong.pythonanywhere.com${user.coverImage}` : null
  );
  const dispatch = useContext(MyDispatchContext);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    dispatch({ type: "logout" });
  };

  const getVaiTroName = (vaiTro) => {
    switch (vaiTro) {
      case 1: return "Quản trị viên";
      case 2: return "Giảng viên";
      case 3: return "Cựu sinh viên";
      default: return "Chưa xác định";
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (user) {
      // Lấy ảnh nền từ API và cập nhật state coverImage với URL đầy đủ (nếu cần)
      axios.get(`https://chickenphong.pythonanywhere.com/users/${user.id}/`)
        .then((response) => {
          if (response.data.coverImage) {
            const fullUrl = `https://chickenphong.pythonanywhere.com${response.data.coverImage}`;
            setCoverImage(fullUrl);
            // Cập nhật lại user nếu cần
            user.coverImage = response.data.coverImage;
          }
        })
        .catch((error) => console.error("Lỗi lấy ảnh nền:", error));

      // Lấy danh sách bài đăng của user
      fetch(`https://chickenphong.pythonanywhere.com/baidangs/`)
        .then((response) => response.json())
        .then((data) => {
          const filteredPosts = data.filter(post => post.nguoiDangBai === user.id);
          const sortedPosts = filteredPosts.sort((b, a) => new Date(b.created_date) - new Date(a.created_date));
          setUserPosts(sortedPosts);
        })
        .catch((error) => console.error("Error fetching user posts:", error));
    }
  }, [user]); 

  const [visible, setVisible] = useState(false);
  const showMenu = () => setVisible(true);
  const hideMenu = () => setVisible(false);

  const pickCoverImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      // Hiển thị ngay ảnh tạm thời (local URI)
      setCoverImage(result.assets[0].uri);
      updateCoverImage(result.assets[0].uri);
    }
  };

  const updateCoverImage = async (uri) => {
    const formData = new FormData();
    formData.append('coverImage', { uri, name: 'cover.jpg', type: 'image/jpeg' });

    try {
      const response = await axios.patch(
        `https://chickenphong.pythonanywhere.com/users/${user.id}/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      Alert.alert("Cập nhật thành công", "Ảnh bìa đã được thay đổi");
      // Nếu server trả về đường dẫn tương đối, ghép domain và cập nhật state
      if (response.data.coverImage) {
        const fullUrl = `https://chickenphong.pythonanywhere.com${response.data.coverImage}`;
        setCoverImage(fullUrl);
        user.coverImage = response.data.coverImage;
      } else {
        // Nếu không có dữ liệu trả về từ server, giữ lại URI đã chọn
        setCoverImage(uri);
        user.coverImage = uri;
      }
    } catch (error) {
      console.error("Lỗi cập nhật ảnh bìa:", error);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh bìa. Hãy thử lại sau.");
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle || !newPostContent) {
      Alert.alert("Thông báo","Vui lòng nhập tiêu đề và nội dung bài đăng");
      return;
    }
  
    const formData = {
      tieuDe: newPostTitle,
      thongTin: newPostContent,
      nguoiDangBai: user.id,
    };
  
    try {
      const response = await axios.post(`https://chickenphong.pythonanywhere.com/baidangs/`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.status === 201) {
        alert("Bài đăng đã được tạo thành công!");
        setNewPostTitle("");
        setNewPostContent("");
        setUserPosts([response.data, ...userPosts]);
      } else {
        alert("Không thể đăng bài, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại sau!");
    }
  };

  return (
    <Provider>
      <ScrollView style={styles.container}>
        {user ? (
          <>
            <TouchableOpacity onPress={pickCoverImage} style={styles.coverContainer}>
              {/* Sử dụng biến coverImage state để hiển thị ảnh bìa */}
              <Image
                source={coverImage ? { uri: coverImage } : require("../../assets/anh3.jpg")}
                style={styles.coverImage}
              />
            </TouchableOpacity>
            <View style={styles.profileHeader}>
              <Image
                source={user.image ? { uri: `https://chickenphong.pythonanywhere.com${user.image}` } : null}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.last_name} {user.first_name}</Text>
                <Text style={styles.profileUsername}>@{user.username}</Text>
              </View>
              <Menu
                visible={visible}
                onDismiss={hideMenu}
                anchor={<IconButton icon="dots-vertical" size={24} onPress={showMenu} />}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              >
                <Menu.Item onPress={logout} title="Đăng xuất" />
              </Menu>
            </View>
  
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Thông tin liên hệ</Text>
              <Text style={styles.contactText}>Số điện thoại: {user.SDT}</Text>
              <Text style={styles.contactText}>Email: {user.email}</Text>
              <Text style={styles.contactText}>Vai trò: {getVaiTroName(user.vaiTro)}</Text>
              <Text style={styles.contactText}>Ngày tham gia: {formatDate(user.date_joined)}</Text>
            </View>

            {user.vaiTro === 2 && (
              <View style={styles.manageTroContainer}>
                <Button mode="contained" onPress={() => navigation.navigate('ChangePassword')}>
                  Thay đổi mật khẩu
                </Button>
              </View>
            )}

            {user.vaiTro === 3 && (
              <View style={styles.addPostForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Tiêu đề bài đăng"
                  value={newPostTitle}
                  onChangeText={setNewPostTitle}
                />
                <TextInput
                  style={styles.textArea}
                  placeholder="Nội dung bài đăng"
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                />
                <Button mode="contained" onPress={handleCreatePost}>Đăng bài</Button>
              </View>
            )}

            <Text style={styles.postsTitle}>Bài viết của {user.first_name}:</Text>
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

            <View style={MyStyles.container}>
              <Button mode="contained-tonal" onPress={logout}>Đăng xuất</Button>
            </View>
          </>
        ) : (
          <Text>Đang tải thông tin người dùng...</Text>
        )}
      </ScrollView>
    </Provider>
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
    marginLeft: 15,
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
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0288d1",
  },
  postDate: {
    fontSize: 14,
    color: "#888",
  },
  postInfo: {
    fontSize: 14,
    color: "#555",
  },
  noPostsText: {
    color: "#888",
    fontStyle: "italic",
    marginTop: 20,
  },
  addPostForm: {
    marginTop: 20,
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    height: 100,
  },
});

export default Profile;
