import React, { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { getDatabase, ref, onValue, push, set } from "firebase/database";
import { MyUserContext } from "../../configs/MyUserContext";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment"; 

const ChatScreen = ({ route }) => {
  const { recipientId, recipientName } = route.params;
  const user = useContext(MyUserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const db = getDatabase();

  const chatId = user.id < recipientId ? `${user.id}_${recipientId}` : `${recipientId}_${user.id}`;

  // Lắng nghe tin nhắn từ Firebase
  useEffect(() => {
    const chatRef = ref(db, `chats/${chatId}/messages`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messageList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  // Gửi tin nhắn lên Firebase
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    try {
      const messageRef = push(ref(db, `chats/${chatId}/messages`));
      await set(messageRef, {
        sender: user.id,
        receiver: recipientId,
        message: newMessage,
        timestamp: Date.now(),
      });

      setNewMessage(""); // Xóa input sau khi gửi
    } catch (error) {
    }
  };

  // Hàm kiểm tra nếu ngày của tin nhắn khác với tin nhắn trước đó thì hiển thị ngày
  const renderMessageItem = ({ item, index }) => {
    const messageDate = moment(item.timestamp).format("dddd, DD/MM/YYYY");
    const previousMessageDate = index > 0 ? moment(messages[index - 1].timestamp).format("dddd, DD/MM/YYYY") : null;
    const showDateHeader = index === 0 || messageDate !== previousMessageDate; // Chỉ hiển thị nếu khác ngày

    return (
      <>
        {showDateHeader && <Text style={styles.dateHeader}>{messageDate}</Text>}
        <View style={[styles.messageBubble, item.sender === user.id ? styles.myMessage : styles.otherMessage]}>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timestamp}>{moment(item.timestamp).format("HH:mm")}</Text>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nhắn tin với {recipientName}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f9f9f9" },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  dateHeader: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "70%",
    alignSelf: "flex-start",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  otherMessage: {
    backgroundColor: "#4CAF50",
  },
  messageText: { color: "#fff" },
  timestamp: {
    fontSize: 12,
    color: "#ccc",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 8, marginRight: 10 },
  sendButton: { backgroundColor: "#007AFF", padding: 10, borderRadius: 10 },
});

export default ChatScreen;
