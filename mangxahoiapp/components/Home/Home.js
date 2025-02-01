import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Avatar, ListItem } from "react-native-elements";
import { Title, Subheading } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "react-native-vector-icons";
import APIs, { endpoints } from "../../configs/APIs";

const Home = () => {
  const [baidangs, setBaidangs] = useState([]);
  const [filteredBaidangs, setFilteredBaidangs] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [users, setUsers] = useState({});
  const [refreshing, setRefreshing] = useState(false); // Thêm state để làm mới
  const navigation = useNavigation();

  const loadBaidangs = async () => {
    try {
      const res = await APIs.get(endpoints["baidangs"]);
      const reversedData = res.data.reverse();

      const usersData = {};
      for (const baiDang of reversedData) {
        if (!usersData[baiDang.nguoiDangBai]) {
          const userRes = await APIs.get(`/users/${baiDang.nguoiDangBai}`);
          usersData[baiDang.nguoiDangBai] = userRes.data;
        }
      }

      setBaidangs(reversedData);
      setFilteredBaidangs(reversedData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  useEffect(() => {
    loadBaidangs();
  }, []);

  useEffect(() => {
    if (filterType) {
      const filtered = baidangs.filter((b) => {
        const user = users[b.nguoiDangBai];
        if (!user || !user.vaiTro) return false;

        if (filterType === "Cựu sinh viên") {
          return user.vaiTro === 3;
        }
        if (filterType === "Giảng viên") {
          return user.vaiTro === 2;
        }
        return false;
      });
      setFilteredBaidangs(filtered);
    } else {
      setFilteredBaidangs(baidangs);
    }
  }, [filterType, baidangs, users]);

  const handleRefresh = async () => {
    setRefreshing(true); // Bắt đầu trạng thái làm mới
    await loadBaidangs(); // Gọi API để làm mới dữ liệu
    setRefreshing(false); // Kết thúc trạng thái làm mới
  };

  

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Bài đăng</Text>
        <Ionicons
          name="search"
          size={30}
          color="#0288d1"
          style={styles.searchIcon}
          onPress={() => navigation.navigate("TimNguoiKhac")}
        />
        <Ionicons
          name="add-circle"
          size={30}
          color="#0288d1"
          style={styles.addIcon}
          onPress={() => navigation.navigate("CreatePost")}
        />
      </View>

      {filteredBaidangs.length === 0 ? (
        <Text>Không có bài đăng với loại này.</Text>
      ) : (
        filteredBaidangs.map((b) => (
          <ListItem
            key={b.id}
            bottomDivider
            onPress={() => navigation.navigate("ChiTietBaiDang", { baiDang: b })}
          >
            <Avatar
              rounded
              size="medium"
              source={
                users[b.nguoiDangBai]?.image
                  ? { uri: `https://chickenphong.pythonanywhere.com${users[b.nguoiDangBai].image}` }
                  : null
              }
            />
            <ListItem.Content>
              <View style={styles.postHeader}>
                <Title>
                  {users[b.nguoiDangBai]?.last_name} {users[b.nguoiDangBai]?.first_name}
                </Title>
              </View>
              <Subheading style={styles.subtitle}>{b.tieuDe}</Subheading>
              <Text style={styles.date}>
                Ngày đăng: {new Date(b.created_date).toLocaleString("vi-VN")}
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
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  subtitle: {
    color: "#555",
    marginTop: 5,
  },
  date: {
    color: "#888",
    fontSize: 12,
    marginTop: 5,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
});

export default Home;
