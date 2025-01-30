import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Button, ActivityIndicator } from "react-native";
import APIs, { endpoints } from "../../configs/APIs";
import { ListItem } from "react-native-elements";
import { decode } from 'html-entities';

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        console.log("Fetching surveys...");
        const res = await APIs.get(endpoints["khaosats"]);
        console.log("API Response:", res.data);
        setSurveys(res.data);
      } catch (error) {
        console.error("Lỗi khi tải khảo sát:", error);
        setError("Không thể tải khảo sát.");
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Khảo Sát</Text>

      {loading ? <ActivityIndicator size="large" color="#0288d1" /> : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {surveys.length === 0 && !loading ? (
        <Text style={styles.emptyText}>Không có khảo sát nào.</Text>
      ) : (
        surveys.map((item) => (
          <ListItem key={item.id} bottomDivider>
            <ListItem.Content>
              <ListItem.Title style={styles.title}>{item.tieuDe || "Không có tiêu đề"}</ListItem.Title>
              <ListItem.Subtitle style={styles.subtitle}>
                {item.moTa ? decode(item.moTa) : "Không có mô tả"}
              </ListItem.Subtitle>
              <Button title="Tham gia" onPress={() => alert("Tham gia khảo sát")} />
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
});

export default Surveys;
