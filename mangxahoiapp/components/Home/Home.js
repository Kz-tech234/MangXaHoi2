import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, ScrollView, Alert } from "react-native";
import { Avatar, ListItem } from "react-native-elements";
import { Title, Subheading } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from 'react-native-vector-icons';  
import APIs, { endpoints } from "../../configs/APIs";

import { getDatabase, ref, set } from "firebase/database";

const Home = () => {
  const [baidangs, setBaidangs] = useState([]);
  const [filteredBaidangs, setFilteredBaidangs] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [users, setUsers] = useState({});  
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
      const filtered = baidangs.filter(b => {
        const user = users[b.nguoiDangBai];
        if (!user || !user.vaiTro) return false;
        
        if (filterType === "Tìm phòng") {
          return user.vaiTro === 3;  
        }
        if (filterType === "Cho thuê") {
          return user.vaiTro === 2;  
        }
        return false;
      });
      setFilteredBaidangs(filtered);
    } else {
      setFilteredBaidangs(baidangs);
    }
  }, [filterType, baidangs, users]);

  const getTagByVaiTro = (vaiTro) => {
    if (vaiTro === 1) return "Quản trị viên";
    if (vaiTro === 2) return "Cho thuê phòng";
    if (vaiTro === 3) return "Tìm phòng";
    return "";
  };

  const getTagStyle = (vaiTro) => {
    if (vaiTro === 1) return styles.adminTag;
    if (vaiTro === 2) return styles.rentTag;
    if (vaiTro === 3) return styles.findRoomTag;
    return {};
  };

  return (
    <ScrollView style={styles.container}> 
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
              source={users[b.nguoiDangBai]?.image ? { uri: `https://chickenphong.pythonanywhere.com${users[b.nguoiDangBai].image}` } : null}
            />
            <ListItem.Content>
              <View style={styles.postHeader}>
                <Title>{users[b.nguoiDangBai]?.last_name} {users[b.nguoiDangBai]?.first_name}</Title>
                <Text style={getTagStyle(users[b.nguoiDangBai]?.vaiTro)}>
                  {getTagByVaiTro(users[b.nguoiDangBai]?.vaiTro)}
                </Text>
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
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
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
  findRoomTag: {
    backgroundColor: "#0288d1",
    color: "white",
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
  },
  rentTag: {
    backgroundColor: "#d32f2f",
    color: "white",
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
  },
  adminTag: {
    backgroundColor: "#0288d1",
    color: "white",
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
  },
});

export default Home;
