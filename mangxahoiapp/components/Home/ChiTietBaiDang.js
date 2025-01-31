import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from "react-native";
import { Avatar, Icon } from "react-native-elements";
import { MyUserContext } from "../../configs/MyUserContext";

const reactions = {
    like: "👍", 
    love: "❤️", 
    haha: "😆", 
    wow: "😮", 
    sad: "😢", 
    angry: "😡"
};

const ChiTietBaiDang = ({ route, navigation }) => {
    const userLogin = useContext(MyUserContext);
    const { baiDang } = route.params;
    const [postOwner, setPostOwner] = useState(null);
    const [comments, setComments] = useState([]);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [reactionCounts, setReactionCounts] = useState({
        like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0
    });

    useEffect(() => {
        if (!baiDang?.id) return;

        // Lấy thông tin người đăng bài
        fetch(`https://chickenphong.pythonanywhere.com/users/${baiDang.nguoiDangBai}`)
            .then(response => response.json())
            .then(userData => setPostOwner(userData))
            .catch(error => console.error("Lỗi khi lấy thông tin người đăng bài:", error));

        // Lấy bình luận
        fetch(`https://chickenphong.pythonanywhere.com/binhluans/?baiDang=${baiDang.id}`)
            .then(response => response.json())
            .then(data => {
                // Lấy thông tin người dùng cho mỗi bình luận
                Promise.all(data.map(comment =>
                    fetch(`https://chickenphong.pythonanywhere.com/users/${comment.nguoiBinhLuan}`)
                        .then(response => response.json())
                        .then(userData => ({ ...comment, user: userData }))
                ))
                .then(commentsWithUserData => setComments(commentsWithUserData))
                .catch(error => console.error("Lỗi khi lấy thông tin người dùng:", error));
            })
            .catch(error => console.error("Lỗi khi lấy bình luận:", error));

        // Lấy các tương tác hiện tại
        fetch(`https://chickenphong.pythonanywhere.com/reactions/?baiDang=${baiDang.id}`)
            .then(response => response.json())
            .then(data => {
                // Cập nhật số lượng các tương tác
                const counts = {
                    like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0
                };
                data.forEach(reaction => {
                    if (reactionCounts[reaction.loai] !== undefined) {
                        counts[reaction.loai]++;
                    }
                });
                setReactionCounts(counts);
            })
            .catch(error => console.error("Lỗi khi lấy dữ liệu tương tác:", error));
    }, [baiDang.id]);

    const handleReactionSelect = (reaction) => {
        if (selectedReaction === reaction) {
            setReactionCounts(prev => ({ ...prev, [reaction]: prev[reaction] - 1 }));
            setSelectedReaction(null);
        } else {
            if (selectedReaction) {
                setReactionCounts(prev => ({ ...prev, [selectedReaction]: prev[selectedReaction] - 1 }));
            }
            setSelectedReaction(reaction);
            setReactionCounts(prev => ({ ...prev, [reaction]: prev[reaction] + 1 }));

            // Gửi tương tác lên server
            fetch("https://chickenphong.pythonanywhere.com/reactions/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    baiDang: baiDang.id,
                    nguoiThucHien: userLogin?.id || "Ẩn danh",
                    loai: reaction
                }),
            })
            .then(response => response.json())
            .catch(error => console.error("Lỗi khi gửi dữ liệu tương tác:", error));
        }
    };

    const handleCommentSubmit = () => {
        if (newComment.trim() === "") return;

        fetch("https://chickenphong.pythonanywhere.com/binhluans/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                baiDang: baiDang.id,
                noiDung: newComment,
                nguoiBinhLuan: userLogin?.id || "Ẩn danh",
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.id) {
                setComments(prevComments => [data, ...prevComments]);
                setNewComment("");
            } else {
                console.error("API không trả về dữ liệu hợp lệ:", data);
            }
        })
        .catch(error => console.error("Lỗi khi gửi bình luận:", error));
    };

    const getImageUrl = (imagePath) => {
        // Kiểm tra nếu có ảnh hợp lệ, trả về URL đầy đủ
        return imagePath && imagePath.startsWith("http") ? imagePath : `https://chickenphong.pythonanywhere.com${imagePath}`;
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.postHeader}>
                {postOwner && (
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Profile', { userId: baiDang.nguoiDangBai })} // Điều hướng đến Profile người đăng bài
                    >
                        <Avatar rounded size="medium" source={getImageUrl(postOwner.image) ? { uri: getImageUrl(postOwner.image) } : require("../../assets/default-avatar.png")} containerStyle={styles.avatar} />
                    </TouchableOpacity>
                )}
                <View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile', { userId: baiDang.nguoiDangBai })} // Điều hướng đến Profile người đăng bài
                    >
                        <Text style={styles.username}>{postOwner ? `${postOwner.first_name} ${postOwner.last_name}` : "Người dùng"}</Text>
                    </TouchableOpacity>
                    <Text style={styles.date}>{new Date(baiDang.created_date).toLocaleString()}</Text>
                </View>
            </View>

            <Text style={styles.content}>{baiDang.thongTin}</Text>

            {baiDang.image && <Image source={{ uri: baiDang.image }} style={styles.postImage} />}

            <View style={styles.postFooter}>
                <TouchableOpacity 
                    style={styles.footerButton} 
                    onPress={() => handleReactionSelect("like")}
                >
                    <Text style={styles.reactionText}>
                        {selectedReaction ? reactions[selectedReaction] : "👍"}
                    </Text>
                    <Text style={[styles.footerText, { color: selectedReaction ? "#007bff" : "#666" }]}>{selectedReaction ? "Bạn đã thích" : "Thích"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerButton} onPress={() => setShowCommentInput(!showCommentInput)}>
                    <Icon name="chat-bubble-outline" type="material" color="#666" />
                    <Text style={styles.footerText}>Bình luận</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerButton}>
                    <Icon name="share" type="material" color="#666" />
                    <Text style={styles.footerText}>Chia sẻ</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.reactionCountContainer}>
                {Object.keys(reactions).map(reaction => (
                    <Text key={reaction} style={styles.reactionCount}>
                        {reactions[reaction]} {reactionCounts[reaction]}
                    </Text>
                ))}
            </View>

            {showCommentInput && (
                <View style={styles.commentInputContainer}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Viết bình luận..."
                        placeholderTextColor="#888"
                        value={newComment}
                        onChangeText={setNewComment}
                    />
                    <TouchableOpacity onPress={handleCommentSubmit} style={styles.sendButton}>
                        <Icon name="send" type="material" color={newComment.trim() ? "#007bff" : "#ccc"} />
                    </TouchableOpacity>
                </View>
            )}

            <Text style={styles.commentListTitle}>Bình luận ({comments.length})</Text>
            {comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Profile', { userId: comment.user.id })} // Điều hướng đến Profile người bình luận
                    >
                        <Avatar rounded size="small" source={comment.user?.image ? { uri: getImageUrl(comment.user.image) } : require("../../assets/default-avatar.png")} />
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Profile', { userId: comment.user.id })} // Điều hướng đến Profile người bình luận
                        >
                            <Text style={styles.commentUser}>{comment.user?.first_name} {comment.user?.last_name || "Ẩn danh"}</Text>
                        </TouchableOpacity>
                        <Text>{comment.noiDung}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 10 },
    postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    username: {
        fontSize: 16, 
        fontWeight: "bold", 
        color: "#333", 
    },
    date: { fontSize: 12, color: "#888" },
    content: { fontSize: 14, color: "#333", marginVertical: 10 },
    postImage: { width: "100%", height: 200, marginBottom: 10 },
    postFooter: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#ddd" },
    footerButton: { flexDirection: "row", alignItems: "center" },
    footerText: { marginLeft: 5, fontSize: 14, color: "#666" },
    reactionCountContainer: { flexDirection: "row", justifyContent: "center", marginTop: 5 },
    reactionCount: { fontSize: 14, marginHorizontal: 5, color: "#666" },
    commentInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, marginVertical: 10, marginHorizontal: 10 },
    commentInput: { flex: 1, fontSize: 14, color: "#333" },
    sendButton: { paddingHorizontal: 10 },
    commentListTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 10 },
    commentItem: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
    commentContent: { marginLeft: 10, backgroundColor: "#f0f0f0", padding: 10, borderRadius: 10 },
    commentUser: { fontSize: 14, fontWeight: "bold", marginBottom: 3 },
});

export default ChiTietBaiDang;
