import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, RefreshControl, Alert } from "react-native";
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
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedComment, setEditedComment] = useState("");
    const [reactionCounts, setReactionCounts] = useState({
        like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!baiDang?.id) return;
        loadPostData();
    }, [baiDang.id]);

    const loadPostData = () => {
        setRefreshing(true);
    
        // Lấy thông tin người đăng bài
        fetch(`https://chickenphong.pythonanywhere.com/users/${baiDang.nguoiDangBai}`)
            .then(response => response.json())
            .then(userData => setPostOwner(userData))
            .catch(error => console.error("Lỗi khi lấy thông tin người đăng bài:", error));
    
        // Lấy bình luận
        fetch(`https://chickenphong.pythonanywhere.com/binhluans/?baiDang=${baiDang.id}`)
            .then(response => response.json())
            .then(data => {
                // Lọc chỉ những bình luận có baiDang trùng với id của bài đăng
                const filteredComments = data.filter(comment => comment.baiDang === baiDang.id);
    
                // Sắp xếp bình luận theo thời gian giảm dần (comment mới nhất nằm trên cùng)
                filteredComments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
                // Lấy thông tin người dùng cho mỗi bình luận
                return Promise.all(filteredComments.map(comment =>
                    fetch(`https://chickenphong.pythonanywhere.com/users/${comment.nguoiBinhLuan}`)
                        .then(response => response.json())
                        .then(userData => ({ ...comment, user: userData }))
                ));
            })
            .then(commentsWithUserData => setComments(commentsWithUserData))
            .catch(error => console.error("Lỗi khi lấy thông tin người dùng:", error))
            .finally(() => setRefreshing(false));
    };
    

    const handleCommentLongPress = async (comment) => {
        if (!userLogin) return;
    
        try {
            console.log("🛠 Kiểm tra quyền trên bình luận ID:", comment.id);
    
            // Lấy thông tin bài đăng
            const postResponse = await fetch(`https://chickenphong.pythonanywhere.com/baidangs/${comment.baiDang}/`);
            if (!postResponse.ok) {
                console.error("❌ Lỗi khi lấy thông tin bài đăng:", postResponse.status);
                return;
            }
    
            const postData = await postResponse.json();
            console.log("👑 Chủ bài đăng ID:", postData.nguoiDangBai);
    
            // Kiểm tra quyền
            const isPostOwner = userLogin.id === postData.nguoiDangBai; // Chủ bài đăng
            const isCommentOwner = userLogin.id === comment.nguoiBinhLuan; // Chủ bình luận
    
            console.log("✅ Chủ bài đăng:", isPostOwner, "| ✅ Chủ bình luận:", isCommentOwner);
    
            let options = [];
    
            if (isCommentOwner) {
                options.push({ text: "Sửa", onPress: () => startEditingComment(comment) });
            }
    
            if (isPostOwner || isCommentOwner) {
                options.push({ text: "Xóa", onPress: () => deleteComment(comment) });
            }
    
            options.push({ text: "Hủy", style: "cancel" });
    
            if (options.length > 1) {
                Alert.alert("Tuỳ chọn", "Bạn muốn làm gì với bình luận này?", options);
            } else {
                console.log("🚫 Người dùng không có quyền sửa hoặc xóa bình luận này.");
            }
        } catch (error) {
            console.error("Lỗi khi lấy thông tin bài đăng:", error);
        }
    };
    
    
    const deleteComment = async (comment) => {
        if (!userLogin) {
            Alert.alert("Lỗi", "Bạn cần đăng nhập để thực hiện thao tác này.");
            return;
        }
    
        try {
            console.log("🔍 Đang kiểm tra quyền xóa bình luận ID:", comment.id);
            console.log("👤 Người dùng hiện tại ID:", userLogin.id);
            console.log("📌 Bài đăng ID:", comment.baiDang);
    
            // Lấy thông tin bài đăng để kiểm tra chủ bài đăng
            const postResponse = await fetch(`https://chickenphong.pythonanywhere.com/baidangs/${comment.baiDang}/`);
            if (!postResponse.ok) {
                console.error("❌ Lỗi khi lấy thông tin bài đăng:", postResponse.status);
                Alert.alert("Lỗi", "Không thể lấy thông tin bài đăng.");
                return;
            }
    
            const postData = await postResponse.json();
            console.log("👑 Chủ bài đăng ID:", postData.nguoiDangBai);
    
            // Kiểm tra quyền
            const isPostOwner = userLogin.id === postData.nguoiDangBai; // Chủ bài đăng
            const isCommentOwner = userLogin.id === comment.nguoiBinhLuan; // Chủ bình luận
    
            console.log("✅ Chủ bài đăng:", isPostOwner, "| ✅ Chủ bình luận:", isCommentOwner);
    
            if (!isPostOwner && !isCommentOwner) {
                Alert.alert("Lỗi", "Bạn không có quyền xóa bình luận này.");
                return;
            }
    
            // Gửi yêu cầu xóa bình luận
            const response = await fetch(`https://chickenphong.pythonanywhere.com/binhluans/${comment.id}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${userLogin.token}`, // Đảm bảo gửi token
                }
            });
    
            console.log("🔄 Response status khi xóa bình luận:", response.status);
    
            if (response.ok) {
                setComments(prevComments => prevComments.filter(c => c.id !== comment.id));
                console.log(`✅ Bình luận ${comment.id} đã bị xóa thành công.`);
            } else {
                const errorText = await response.text();
                console.error("❌ Lỗi khi xóa bình luận:", errorText);
                Alert.alert("Lỗi", errorText);
            }
        } catch (error) {
            console.error("❌ Lỗi khi xóa bình luận:", error);
            Alert.alert("Lỗi", "Không thể kết nối đến server.");
        }
    };
    
    

    const updateComment = async () => {
        if (!editedComment.trim()) {
            Alert.alert("Lỗi", "Bình luận không được để trống.");
            return;
        }
    
        try {
            console.log("✍️ Đang cập nhật bình luận ID:", editingCommentId);
            console.log("📝 Nội dung mới:", editedComment);
    
            const response = await fetch(`https://chickenphong.pythonanywhere.com/binhluans/${editingCommentId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userLogin.token}` // Nếu API yêu cầu token
                },
                body: JSON.stringify({
                    noiDung: editedComment,
                    baiDang: baiDang.id, // Thêm trường này để tránh lỗi API
                    nguoiBinhLuan: userLogin.id // Chỉ cho phép sửa bình luận của mình
                }),
            });
    
            console.log("🔄 Response status khi cập nhật bình luận:", response.status);
    
            if (response.ok) {
                const updatedComment = await response.json();
                setComments(prevComments =>
                    prevComments.map(comment =>
                        comment.id === editingCommentId ? { ...comment, noiDung: updatedComment.noiDung } : comment
                    )
                );
                setEditingCommentId(null);
                setEditedComment("");
                console.log("✅ Bình luận đã được cập nhật.");
            } else {
                const errorText = await response.text();
                console.error("❌ Lỗi khi cập nhật bình luận:", errorText);
                Alert.alert("Lỗi", "Không thể cập nhật bình luận. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật bình luận:", error);
            Alert.alert("Lỗi", "Không thể kết nối đến server.");
        }
    };
    
    

    const startEditingComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditedComment(comment.noiDung);
    };


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
        return imagePath && imagePath.startsWith("http") ? imagePath : `https://chickenphong.pythonanywhere.com${imagePath}`;
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={loadPostData} />
            }
        >
            <View style={styles.postHeader}>
                {postOwner && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('TrangCaNhan', { userId: baiDang.nguoiDangBai })} // Điều hướng đến Profile người đăng bài
                    >
                        <Avatar
                            rounded
                            size="medium"
                            source={getImageUrl(postOwner.image) ? { uri: getImageUrl(postOwner.image) } : require("../../assets/default-avatar.png")}
                            containerStyle={styles.avatar}
                        />
                    </TouchableOpacity>
                )}
                <View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('TrangCaNhan', { userId: baiDang.nguoiDangBai })} // Điều hướng đến Profile người đăng bài
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
            {comments.map(comment => {
                const isCommentOwner = userLogin?.id === comment.nguoiBinhLuan;
                return (
                    <View key={comment.id} style={styles.commentItem}>
                        <TouchableOpacity onPress={() => navigation.navigate('TrangCaNhan', { userId: comment.user.id })}>
                            <Avatar
                                rounded
                                size="small"
                                source={comment.user?.image ? { uri: getImageUrl(comment.user.image) } : require("../../assets/default-avatar.png")}
                            />
                        </TouchableOpacity>
                        <View style={styles.commentContent}>
                            <TouchableOpacity
                                onLongPress={() => {
                                    if (isCommentOwner) {
                                        handleCommentLongPress(comment);
                                    }
                                }}
                            >
                                <Text style={styles.commentUser}>
                                    {comment.user?.first_name} {comment.user?.last_name || "Ẩn danh"}
                                </Text>
                                {/* 🔹 Hiển thị thời gian bình luận */}
                                <Text style={styles.commentTime}>
                                    {new Date(comment.created_date).toLocaleString("vi-VN")}
                                </Text>
                                {editingCommentId === comment.id ? (
                                    <TextInput
                                        style={styles.commentInput}
                                        value={editedComment}
                                        onChangeText={setEditedComment}
                                        onSubmitEditing={updateComment}  // Bấm Enter để cập nhật
                                        onBlur={updateComment}  // Khi mất focus cũng cập nhật
                                        autoFocus
                                    />
                                ) : (
                                    <Text>{comment.noiDung}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 10 },
    postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    username: { fontSize: 16, fontWeight: "bold", color: "#333" },
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
    commentTime: { fontSize: 12, color: "#888", marginBottom: 5 },
});

export default ChiTietBaiDang;
