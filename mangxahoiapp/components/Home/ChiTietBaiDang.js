import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert } from "react-native";
import { Avatar } from "react-native-elements";
import { Subheading } from "react-native-paper";
import { MyUserContext } from "../../configs/MyUserContext";


const ChiTietBaiDang = ({ route }) => {
  const userLogin = useContext(MyUserContext);
  const { baiDang } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postOwner, setPostOwner] = useState(null);
  const [userComments, setUserComments] = useState({});

  useEffect(() => {
    if (!baiDang?.id) return;

    setComments([]); // Reset danh sách bình luận

    // Lấy thông tin người đăng bài
    fetch(`https://chickenphong.pythonanywhere.com/users/${baiDang.nguoiDangBai}`)
      .then(response => response.json())
      .then(userData => setPostOwner(userData))
      .catch(error => console.error("Lỗi khi lấy thông tin người đăng bài:", error));

    // Lấy bình luận của bài đăng hiện tại
    fetch(`https://chickenphong.pythonanywhere.com/binhluans/?baiDang=${baiDang.id}`)
      .then(response => response.json())
      .then(async (data) => {
        setComments(data.filter(comment => comment.baiDang === baiDang.id)); // Chỉ giữ bình luận đúng bài đăng

        // Lấy danh sách người bình luận
        const userIds = [...new Set(data.map(comment => comment.nguoiBinhLuan))];
        const usersData = {};
        await Promise.all(
          userIds.map(async (userId) => {
            const res = await fetch(`https://chickenphong.pythonanywhere.com/users/${userId}`);
            const userData = await res.json();
            usersData[userId] = userData;
          })
        );
        setUserComments(usersData);
      })
      .catch(error => console.error("Lỗi khi lấy bình luận:", error));

  }, [baiDang.id]); // Chạy lại khi bài đăng thay đổi

  const handleCommentSubmit = () => {
    if (newComment.trim() === "") return;

    fetch("https://chickenphong.pythonanywhere.com/binhluans/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baiDang: baiDang.id,
        noiDung: newComment,
        nguoiBinhLuan: userLogin.id, 
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.baiDang === baiDang.id) {
          setComments(prevComments => [data, ...prevComments]);

          if (!userComments[userLogin.id]) {
            fetch(`https://chickenphong.pythonanywhere.com/users/${userLogin.id}`)
              .then(res => res.json())
              .then(userData => {
                setUserComments(prev => ({
                  ...prev,
                  [userLogin.id]: userData,
                }));
              })
              .catch(error => console.error("Lỗi khi lấy thông tin người bình luận:", error));
          }
        }
        setNewComment("");
      })
      .catch(error => console.error("Lỗi khi gửi bình luận:", error));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.postHeader}>
        {postOwner && (
          <Avatar 
            rounded 
            size="medium" 
            source={postOwner.image ? { uri: postOwner.image } : require("../../assets/default-avatar.png")}
            containerStyle={styles.avatar}
          />
        )}
        <View style={styles.postInfo}>
          <Text style={styles.username}>
            {postOwner ? `${postOwner.first_name} ${postOwner.last_name}` : "Người dùng"}
          </Text>
          <Text style={styles.date}>{new Date(baiDang.created_date).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.contentBox}>
        <Subheading style={styles.subtitle}>{baiDang.tieuDe}</Subheading>
        <Text style={styles.content}>{baiDang.thongTin}</Text>
      </View>

      <View style={styles.commentSection}>
        <TextInput
          style={styles.commentInput}
          placeholder="Nhập bình luận..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button title="Gửi" onPress={handleCommentSubmit} />
      </View>

      <Text style={styles.commentListTitle}>Danh sách bình luận:</Text>
      {comments.map(comment => (
        <View key={comment.id} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <Avatar 
              rounded 
              size="small" 
              source={userComments[comment.nguoiBinhLuan]?.image 
                ? { uri: userComments[comment.nguoiBinhLuan].image } 
                : require("../../assets/default-avatar.png")
              }
              containerStyle={styles.avatar}
            />
            <Text style={styles.commentUser}>
              {userComments[comment.nguoiBinhLuan]?.first_name || "Ẩn danh"} {userComments[comment.nguoiBinhLuan]?.last_name || ""}
            </Text>
          </View>
          <Text style={styles.commentContent}>{comment.noiDung}</Text>
          <Text style={styles.commentDate}>{new Date(comment.created_date).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatar: { marginRight: 10 },
  postInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: "bold" },
  date: { fontSize: 14, color: "#888" },
  contentBox: { backgroundColor: "#e0f7fa", padding: 15, borderRadius: 8 },
  subtitle: { fontSize: 18, fontWeight: "bold" },
  commentSection: { marginTop: 20, flexDirection: "row", alignItems: "center" },
  commentInput: { height: 40, borderColor: "#ddd", borderWidth: 1, borderRadius: 4, flex: 1, paddingHorizontal: 10 },
  commentListTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20 },
  commentItem: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 10 },
  commentHeader: { flexDirection: "row", alignItems: "center" },
  commentUser: { fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  commentContent: { fontSize: 14 },
  commentDate: { fontSize: 12, color: "#888" },
});

export default ChiTietBaiDang;
