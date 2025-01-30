import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import APIs, { endpoints } from "../../configs/APIs";
import { ListItem } from "react-native-elements";
import { decode } from 'html-entities';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        console.log("Fetching notifications...");
        const res = await APIs.get(endpoints["thongbaosukiens"]);
        console.log("API Response:", res.data);
        setNotifications(res.data);
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
        setError("Không thể tải thông báo.");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Thông Báo</Text>
      
      {loading ? <ActivityIndicator size="large" color="#0288d1" /> : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {notifications.length === 0 && !loading ? (
        <Text style={styles.emptyText}>Không có thông báo nào.</Text>
      ) : (
        notifications.map((item) => (
          <ListItem key={item.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.title}>{item.tieuDe || "Không có tiêu đề"}</ListItem.Title>
              <ListItem.Subtitle style={styles.subtitle}>
                {item.noiDung ? decode(item.noiDung) : "Không có nội dung"}
              </ListItem.Subtitle>
              <Text style={styles.date}>
                {item.ngay_gui ? new Date(item.ngay_gui).toLocaleString("vi-VN") : "Không có ngày"}
              </Text>
            </ListItem.Content>
          </ListItem>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    color: "red",
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
});

export default Notifications;
