import React, { useState, useEffect, useContext } from "react";
import { View, Text, ScrollView, StyleSheet, Button, Alert } from "react-native";
import { MyUserContext } from "../../configs/MyUserContext";
import APIs, { endpoints } from "../../configs/APIs";
import { RadioButton } from "react-native-paper";

const SurveyDetail = ({ route, navigation }) => {
  const user = useContext(MyUserContext);
  const { survey } = route.params;
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
        try {
            console.log("Fetching survey questions...");
            const res = await APIs.get(endpoints["cauhois"]);

            // Lọc ra chỉ các câu hỏi thuộc khảo sát hiện tại
            const filteredQuestions = res.data.filter(q => q.khaoSat === survey.id);
            
            console.log("Questions:", filteredQuestions);
            setQuestions(filteredQuestions);
            setAnswers(filteredQuestions.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}));
        } catch (error) {
            console.error("Lỗi khi tải câu hỏi:", error);
        } finally {
            setLoading(false);
        }
    };

    loadQuestions();
}, [survey.id]);


  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const isCompleted = Object.values(answers).every(ans => ans !== null);
    if (!isCompleted) {
        Alert.alert("Lỗi", "Vui lòng trả lời tất cả câu hỏi.");
        return;
    }

    try {
        // Fetch danh sách lựa chọn từ API
        const luaChonRes = await APIs.get(endpoints["luachons"]);
        const luaChonList = luaChonRes.data;  // Lấy danh sách lựa chọn

        for (const [questionId, answer] of Object.entries(answers)) {
            // Tìm ID của luaChon dựa trên câu hỏi và nội dung lựa chọn
            const luaChonObj = luaChonList.find(
                (lc) => lc.cauHoi === parseInt(questionId) && lc.noiDung === answer
            );

            if (!luaChonObj) {
                console.error(`Không tìm thấy luaChon phù hợp cho câu hỏi ${questionId}`);
                continue;
            }

            const payload = {
                khaoSat: survey.id,
                nguoiTraLoi: user.id,
                cauHoi: questionId,
                luaChon: luaChonObj.id  // Sử dụng ID chính xác của luaChon
            };

            console.log("Dữ liệu gửi đi:", payload);
            await APIs.post(endpoints["tralois"], payload);
        }

        Alert.alert("Thành công", "Bạn đã hoàn thành khảo sát!");
        navigation.goBack();
    } catch (error) {
        console.error("Lỗi khi gửi khảo sát:", error.response?.data || error.message);
        Alert.alert("Lỗi", "Không thể gửi khảo sát.");
    }
};
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{survey.tieuDe}</Text>
      <Text style={styles.description}>{survey.moTa}</Text>

      {loading ? <Text style={styles.loadingText}>Đang tải câu hỏi...</Text> : null}

      {questions.map((question) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.noiDung}</Text>
          <RadioButton.Group
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            value={answers[question.id]}
          >
            <View style={styles.optionContainer}>
              <RadioButton value="Có" />
              <Text>Có</Text>
            </View>
            <View style={styles.optionContainer}>
              <RadioButton value="Không" />
              <Text>Không</Text>
            </View>
          </RadioButton.Group>
        </View>
      ))}

      <Button title="Hoàn thành" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  description: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  loadingText: { textAlign: "center", fontSize: 16, marginTop: 20 },
  questionContainer: { marginBottom: 20 },
  questionText: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  optionContainer: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
});

export default SurveyDetail;
