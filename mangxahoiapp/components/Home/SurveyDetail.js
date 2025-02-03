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
  const [surveyCompleted, setSurveyCompleted] = useState(false); // Trạng thái khảo sát đã hoàn thành

  useEffect(() => {
    const loadSurveyData = async () => {
        if (!user || !user.id) {
            console.log("🚨 Không tìm thấy user.id, kiểm tra lại đăng nhập!");
            return;
        }

        try {
            console.log(`📥 Đang tải dữ liệu khảo sát cho user ID: ${user.id}...`);

            // Lấy danh sách câu hỏi
            const questionRes = await APIs.get(endpoints["cauhois"]);
            const filteredQuestions = questionRes.data.filter(q => q.khaoSat === survey.id);
            setQuestions(filteredQuestions);
            setAnswers(filteredQuestions.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}));

            // Kiểm tra xem user hiện tại đã làm khảo sát chưa
            console.log("📥 Đang kiểm tra khảo sát đã hoàn thành của user...");
            const response = await APIs.get(`${endpoints["tralois"]}?nguoiTraLoi=${user.id}`);
            
            // Log dữ liệu phản hồi từ API
            console.log("📊 API Trả lời khảo sát:", response.data);

            const userSurveys = response.data.filter(traloi => traloi.nguoiTraLoi === user.id && traloi.khaoSat === survey.id);

            if (userSurveys.length > 0) {
                console.log("✅ User đã hoàn thành khảo sát này trước đó.");
                setSurveyCompleted(true);
            } else {
                console.log("🆕 User chưa hoàn thành khảo sát, có thể làm.");
                setSurveyCompleted(false);
            }

        } catch (error) {
            console.error("❌ Lỗi khi tải dữ liệu khảo sát:", error);
        } finally {
            setLoading(false);
        }
    };

    loadSurveyData();
  }, [survey.id, user]); // Khi user thay đổi, dữ liệu sẽ được cập nhật lại



  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (surveyCompleted) {
      Alert.alert("Bạn đã hoàn thành bài khảo sát", "Bạn không thể làm lần nữa.");
      return;
    }

    const isCompleted = Object.values(answers).every(ans => ans !== null);
    if (!isCompleted) {
      Alert.alert("Lỗi", "Vui lòng trả lời tất cả câu hỏi.");
      return;
    }

    try {
      const luaChonRes = await APIs.get(endpoints["luachons"]);
      const luaChonList = luaChonRes.data;

      for (const [questionId, answer] of Object.entries(answers)) {
        const luaChonObj = luaChonList.find(lc => lc.cauHoi === parseInt(questionId) && lc.noiDung === answer);
        if (!luaChonObj) {
          console.error(`Không tìm thấy lựa chọn phù hợp cho câu hỏi ${questionId}`);
          continue;
        }

        const payload = {
          khaoSat: survey.id,
          nguoiTraLoi: user.id,
          cauHoi: questionId,
          luaChon: luaChonObj.id
        };

        await APIs.post(endpoints["tralois"], payload);
      }

      setSurveyCompleted(true); // Cập nhật trạng thái đã hoàn thành

      // Hiển thị thông báo và quay lại màn hình danh sách khảo sát
      Alert.alert("Thành công", "Bạn đã hoàn thành khảo sát!", [
          {
              text: "OK",
              onPress: () => navigation.navigate("Surveys") // Quay lại danh sách khảo sát
          }
      ]);
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

      {surveyCompleted ? (
        <Text style={styles.completedText}>Bạn đã hoàn thành khảo sát. Bạn không thể làm lần nữa.</Text>
      ) : (
        questions.map(question => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.noiDung}</Text>
            <RadioButton.Group onValueChange={value => handleAnswerChange(question.id, value)} value={answers[question.id]}>
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
        ))
      )}

      <Button
        title={surveyCompleted ? "Bạn đã hoàn thành khảo sát" : "Hoàn thành"}
        onPress={handleSubmit}
        disabled={surveyCompleted}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  description: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  loadingText: { textAlign: "center", fontSize: 16, marginTop: 20 },
  completedText: { textAlign: "center", fontSize: 18, fontWeight: "bold", color: "red", marginVertical: 20 },
  questionContainer: { marginBottom: 20 },
  questionText: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  optionContainer: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
});

export default SurveyDetail;
