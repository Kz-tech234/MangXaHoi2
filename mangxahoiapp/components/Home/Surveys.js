import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Button, ActivityIndicator } from "react-native";
import APIs, { endpoints } from "../../configs/APIs";
import { ListItem } from "react-native-elements";
import { decode } from "html-entities";

const Surveys = ({ navigation }) => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const res = await APIs.get(endpoints["khaosats"]);

        // Kiểm tra dữ liệu có chứa 'created_date' không
        if (!res.data || !Array.isArray(res.data)) {
          throw new Error("Dữ liệu khảo sát không hợp lệ.");
        }

        // Sắp xếp khảo sát theo thời gian tạo mới nhất lên trên
        const sortedSurveys = res.data.sort((a, b) => 
          new Date(b.created_date || 0) - new Date(a.created_date || 0)
        );

        setSurveys(sortedSurveys);
      } catch (error) {
        console.error("Lỗi khi tải khảo sát:", error);
        setError("Không thể tải khảo sát.");
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, []);

  // Hàm định dạng thời gian thành hh:mm dd/MM/yyyy
  const formatDateTime = (isoString) => {
    if (!isoString) return "Không có dữ liệu";

    try {
      const date = new Date(isoString);
      
      // Kiểm tra ngày hợp lệ
      if (isNaN(date.getTime())) return "Không có dữ liệu";

      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} ` +
             `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    } catch (error) {
      console.error("Lỗi khi xử lý thời gian:", error);
      return "Không có dữ liệu";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Khảo Sát</Text>

      {loading && <ActivityIndicator size="large" color="#0288d1" />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {surveys.length === 0 && !loading ? (
        <Text style={styles.emptyText}>Không có khảo sát nào.</Text>
      ) : (
        surveys.map((item) => {

          return (
            <ListItem key={item.id} bottomDivider>
              <ListItem.Content>
                <ListItem.Title style={styles.title}>{item.tieuDe || "Không có tiêu đề"}</ListItem.Title>
                <ListItem.Subtitle style={styles.subtitle}>
                  {item.moTa ? decode(item.moTa) : "Không có mô tả"}
                </ListItem.Subtitle>
                <Text style={styles.dateText}>
                  {item.created_date ? `Đăng ngày: ${formatDateTime(item.created_date)}` : "Không có ngày đăng"}
                </Text>
                <Button title="Làm khảo sát" onPress={() => navigation.navigate("SurveyDetail", { survey: item })} />
              </ListItem.Content>
            </ListItem>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  emptyText: { textAlign: "center", marginTop: 20, color: "gray" },
  errorText: { textAlign: "center", marginTop: 20, color: "red", fontSize: 16 },
  title: { fontSize: 16, fontWeight: "bold" },
  subtitle: { fontSize: 14, color: "#555" },
  dateText: { fontSize: 12, color: "#777", marginTop: 5, fontStyle: "italic" },
});

export default Surveys;
