import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert, TouchableOpacity, Image } from "react-native";
import { Avatar } from "react-native-elements";
import { Subheading } from "react-native-paper";
import { MyUserContext } from "../../configs/MyUserContext";

const ChiTietBaiDang = ({ route, navigation }) => {
  const userLogin = useContext(MyUserContext);
  const { baiDang } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postOwner, setPostOwner] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [survey, setSurvey] = useState(null);

  useEffect(() => {
    // Lấy thông tin người đăng bài
    fetch(`https://chickenphong.pythonanywhere.com/users/${baiDang.nguoiDangBai}`)
      .then(response => response.json())
      .then(userData => setPostOwner(userData))
      .catch(error => console.error("Lỗi khi lấy thông tin người đăng bài:", error));

    // Lấy bình luận liên quan đến bài đăng
    fetch(`https://chickenphong.pythonanywhere.com/binhluans/?baiDang=${baiDang.id}`)
      .then(response => response.json())
      .then(data => setComments(data.reverse()))
      .catch(error => console.error("Lỗi khi lấy bình luận:", error));

    // Lấy thông tin cảm xúc
    fetch(`https://chickenphong.pythonanywhere.com/reactions/?baiDang=${baiDang.id}`)
      .then(response => response.json())
      .then(data => setReactions(data))
      .catch(error => console.error("Lỗi khi lấy cảm xúc:", error));

    // Lấy khảo sát nếu có
    fetch(`https://chickenphong.pythonanywhere.com/khaosats/?baiDang=${baiDang.id}`)
      .then(response => response.json())
      .then(data => setSurvey(data[0]))
      .catch(error => console.error("Lỗi khi lấy khảo sát:", error));
  }, [baiDang.id]);

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
      .then((response) => response.json())
      .then((data) => {
        setComments([data, ...comments]);
        setNewComment("");
      })
      .catch((error) => console.error("Lỗi khi gửi bình luận:", error));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.postHeader}>
        {postOwner && (
          <Avatar 
            rounded 
            size="medium" 
            source={postOwner.image ? { uri: postOwner.image } : null}
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

      {survey && (
        <View style={styles.surveySection}>
          <Text style={styles.surveyTitle}>{survey.tieuDe}</Text>
          <Text style={styles.surveyDescription}>{survey.moTa}</Text>
        </View>
      )}

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
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <Text style={styles.commentContent}>{comment.noiDung}</Text>
          <Text style={styles.commentDate}>{new Date(comment.created_date).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    marginRight: 10,
  },
  postInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    color: "#888",
  },
  contentBox: {
    backgroundColor: "#e0f7fa",
    padding: 15,
    borderRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    fontSize: 16,
    marginTop: 10,
  },
  commentSection: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  commentInput: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 4,
    flex: 1,
    paddingHorizontal: 10,
  },
  commentListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  commentItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  commentContent: {
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
    color: "#888",
  },
  surveySection: {
    marginTop: 20,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0288d1",
  },
  surveyDescription: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default ChiTietBaiDang;
