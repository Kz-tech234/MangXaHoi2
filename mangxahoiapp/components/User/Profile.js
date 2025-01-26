import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from "react-native";
import { MyDispatchContext, MyUserContext } from "../../configs/MyUserContext";
import MyStyles from "../../styles/MyStyles";
import { Button, IconButton, Menu, Provider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';


const Profile = ({ route, navigation }) => {
  const user = useContext(MyUserContext);
  const [userPosts, setUserPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const dispatch = useContext(MyDispatchContext);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    dispatch({
      type: "logout"
    });
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
  
  const handleAddPost = () => {
    if (newPostTitle.trim() === "" || newPostContent.trim() === "") {
      alert('Vui lòng điền đủ tiêu đề và nội dung bài đăng!');
      return;
    }
  
  
    fetch("https://chickenphong.pythonanywhere.com/baidangs/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tieuDe: newPostTitle,
        thongTin: newPostContent,
        nguoiDangBai: user.id,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Lỗi từ server: ' + response.status);
        }
        return response.json();
      })
      .then((data) => {
        setUserPosts((prevPosts) => [data, ...prevPosts]);
        setNewPostTitle("");
        setNewPostContent("");
      })
      .catch((error) => {
        console.error("Lỗi khi đăng bài:", error);
        alert("Đã có lỗi xảy ra khi đăng bài. Mã lỗi: " + error.message);
      });
  };

  const [visible, setVisible] = useState(false); // Điều khiển hiển thị menu
  const showMenu = () => setVisible(true); // Hiển thị menu
  const hideMenu = () => setVisible(false); // Ẩn menu

  return (
    <Provider>
    <ScrollView style={styles.container}>
      {user ? (
        <>
          <View style={styles.profileHeader}>
            <Image
              source={user.image ? { uri: `https://chickenphong.pythonanywhere.com${user.image}` } : null}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user.last_name} {user.first_name}
              </Text>
              <Text style={styles.profileUsername}>@{user.username}</Text>
            </View>
            <Menu
              visible={visible}
              onDismiss={hideMenu} // Khi ấn ngoài menu sẽ tắt
              anchor={<IconButton icon="dots-vertical" size={24} onPress={showMenu} />} // Gắn menu vào icon ba chấm
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} // Menu xuất hiện dưới nút ba chấm
              transformOrigin={{ horizontal: 'right', vertical: 'top' }} // Đảm bảo menu mở ra từ dưới nút ba chấm
            >
              {/* <Menu.Item onPress={goToInfo} title="Thông tin" /> */}
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
              <Button mode="contained" onPress={() => navigation.navigate('QuanLyTro')}>
                Quản lý trọ
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
              <Button mode="contained" onPress={handleAddPost}>Đăng bài</Button>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#0288d1",
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
  manageTroContainer: {
    marginTop: 20,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    color: "#0288d1",
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
  postItem: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    paddingTop: 10,
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
  postContent: {
    marginTop: 10,
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
});

export default Profile;
