import React, { useState, useEffect, useContext, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Modal } from "react-native";
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

const ChiTietBaiDang = ({ route }) => {
    const userLogin = useContext(MyUserContext);
    const { baiDang } = route.params;
    const [postOwner, setPostOwner] = useState(null);
    const [comments, setComments] = useState([]);
    const [sortOption, setSortOption] = useState("Bình luận hàng đầu");
    const [showSortModal, setShowSortModal] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [reactionCounts, setReactionCounts] = useState({
        like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0
    });

    useEffect(() => {
        if (!baiDang?.id) return;

        fetch(`https://chickenphong.pythonanywhere.com/users/${baiDang.nguoiDangBai}`)
            .then(response => response.json())
            .then(userData => setPostOwner(userData))
            .catch(error => console.error("Lỗi khi lấy thông tin người đăng bài:", error));

        fetch(`https://chickenphong.pythonanywhere.com/binhluans/?baiDang=${baiDang.id}`)
            .then(response => response.json())
            .then(data => setComments(data))
            .catch(error => console.error("Lỗi khi lấy bình luận:", error));
    }, [baiDang.id]);

    // Xử lý chọn / bỏ chọn cảm xúc
    const handleReactionSelect = (reaction) => {
        setShowReactions(false);
        if (selectedReaction === reaction) {
            setReactionCounts(prev => ({ ...prev, [reaction]: prev[reaction] - 1 }));
            setSelectedReaction(null);
        } else {
            if (selectedReaction) {
                setReactionCounts(prev => ({ ...prev, [selectedReaction]: prev[selectedReaction] - 1 }));
            }
            setSelectedReaction(reaction);
            setReactionCounts(prev => ({ ...prev, [reaction]: prev[reaction] + 1 }));
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.postHeader}>
                {postOwner && (
                    <Avatar rounded size="medium" source={postOwner.image ? { uri: postOwner.image } : require("../../assets/default-avatar.png")} containerStyle={styles.avatar} />
                )}
                <View>
                    <Text style={styles.username}>{postOwner ? `${postOwner.first_name} ${postOwner.last_name}` : "Người dùng"}</Text>
                    <Text style={styles.date}>{new Date(baiDang.created_date).toLocaleString()}</Text>
                </View>
            </View>

            <Text style={styles.content}>{baiDang.thongTin}</Text>

            {baiDang.image && <Image source={{ uri: baiDang.image }} style={styles.postImage} />}

            <View style={styles.postFooter}>
                <TouchableOpacity 
                    style={styles.footerButton} 
                    onPress={() => handleReactionSelect("like")}
                    onLongPress={() => setShowReactions(true)}
                >
                    <Text style={styles.reactionText}>
                        {selectedReaction ? reactions[selectedReaction] : "👍"}
                    </Text>
                    <Text style={[styles.footerText, { color: selectedReaction ? "#007bff" : "#666" }]}>
                        {selectedReaction ? "Bạn đã thích" : "Thích"}
                    </Text>
                </TouchableOpacity>

                {showReactions && (
                    <View style={styles.reactionPopup}>
                        {Object.keys(reactions).map(reaction => (
                            <TouchableOpacity key={reaction} onPress={() => handleReactionSelect(reaction)}>
                                <Text style={styles.reactionOption}>{reactions[reaction]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <TouchableOpacity style={styles.footerButton} onPress={() => setShowCommentInput(!showCommentInput)}>
                    <Icon name="chat-bubble-outline" type="material" color="#666" />
                    <Text style={styles.footerText}>Bình luận</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerButton}>
                    <Icon name="share" type="material" color="#666" />
                    <Text style={styles.footerText}>Chia sẻ</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.reactionCountText}>
                {Object.keys(reactions).map(reaction => (
                    <Text key={reaction}>
                        {reactions[reaction]} {reactionCounts[reaction]}{"  "}
                    </Text>
                ))}
            </Text>

            <View style={styles.commentHeader}>
                <Text style={styles.commentListTitle}>Bình luận ({comments.length})</Text>
                <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.sortButton}>
                    <Text style={styles.sortText}>{sortOption}</Text>
                    <Icon name="arrow-drop-down" type="material" color="#666" />
                </TouchableOpacity>
            </View>

            {comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                    <Avatar rounded size="small" source={require("../../assets/default-avatar.png")} />
                    <View style={styles.commentContent}>
                        <Text style={styles.commentUser}>{comment.userName || "Ẩn danh"}</Text>
                        <Text>{comment.noiDung}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 10 },
    postFooter: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#ddd" },
    footerButton: { flexDirection: "row", alignItems: "center" },
    footerText: { marginLeft: 5, fontSize: 14, color: "#666" },
    reactionPopup: { flexDirection: "row", position: "absolute", bottom: 50, backgroundColor: "white", borderRadius: 10, padding: 5, flexWrap: "wrap" },
    reactionOption: { fontSize: 20, marginHorizontal: 5 },
    reactionText: { fontSize: 18, marginRight: 5 },
    reactionCountText: { textAlign: "center", fontSize: 14, color: "#666", marginTop: 5 },
    container: { flex: 1, backgroundColor: "#fff", padding: 10 },
    postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    avatar: { marginRight: 10 },
    username: { fontSize: 16, fontWeight: "bold" },
    date: { fontSize: 12, color: "#777" },
    content: { fontSize: 16, marginBottom: 10 },
    postImage: { width: "100%", height: 300, borderRadius: 10, marginBottom: 10 },
    postFooter: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#ddd" },
    footerButton: { flexDirection: "row", alignItems: "center" },
    footerText: { marginLeft: 5, fontSize: 14, color: "#666" },
    commentInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginVertical: 10,
      marginHorizontal: 10,
    },
    commentInput: {
      flex: 1,
      fontSize: 14,
      color: "#333",
    },
    sendButton: {
      paddingHorizontal: 10,
    },
    commentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    sortButton: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#eee", borderRadius: 10 },
    sortText: { fontSize: 14, fontWeight: "bold", marginRight: 5 },
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
    sortModal: { backgroundColor: "#fff", padding: 15, borderRadius: 10, width: "100%" },
    sortOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ddd" },
    sortOptionTitle: { fontSize: 16, fontWeight: "bold" },
    sortOptionDescription: { fontSize: 14, color: "#666" },
    commentItem: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
    commentContent: { marginLeft: 10, backgroundColor: "#f0f0f0", padding: 10, borderRadius: 10 },
    commentUser: { fontSize: 14, fontWeight: "bold", marginBottom: 3 },

});

export default ChiTietBaiDang;
