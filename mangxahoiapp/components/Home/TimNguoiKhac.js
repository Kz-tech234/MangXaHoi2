import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, StyleSheet } from "react-native";
import { ListItem, Avatar } from "react-native-elements";
import { useNavigation } from "@react-navigation/native"; 

const TimNguoiKhac = () => {
  const [searchQuery, setSearchQuery] = useState(''); 
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users, setUsers] = useState([]); 
  const navigation = useNavigation(); 

  // 🔹 Lấy danh sách người dùng từ API, chỉ hiển thị tài khoản có role ≠ 1 (không phải admin)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://chickenphong.pythonanywhere.com/users/");
        const data = await response.json();
        
        // Lọc bỏ tài khoản có vai trò `1` (Admin)
        const normalUsers = data.filter(user => user.vaiTro !== 1);
        setUsers(normalUsers); 
        setFilteredUsers(normalUsers); 
      } catch (error) {
        console.error(" Lỗi khi lấy danh sách người dùng:", error);
      }
    };

    fetchUsers();
  }, []); 

  // Xử lý tìm kiếm người dùng theo tên (first_name + last_name)
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return fullName.includes(query.toLowerCase());
    });
    setFilteredUsers(filtered);
  };

  // Điều hướng đến trang cá nhân khi nhấn vào người dùng
  const handleUserPress = (userId) => {
    navigation.navigate("TrangCaNhan", { userId });
  };

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm người dùng */}
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm theo tên..."
        value={searchQuery}
        onChangeText={handleSearch} 
      />

      {/* Danh sách người dùng */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ListItem bottomDivider onPress={() => handleUserPress(item.id)}>
            {/* 🖼 Avatar người dùng */}
            <Avatar 
              rounded 
              size="medium" 
              source={{ 
                uri: item.image 
                  ? `https://chickenphong.pythonanywhere.com${item.image}` 
                  : "https://cbam.edu.vn/wp-content/uploads/2024/10/avatar-mac-dinh-30xJKPDu.jpg" 
              }} 
            />
            <ListItem.Content>
              <Text style={styles.username}>{item.first_name} {item.last_name}</Text>
            </ListItem.Content>
          </ListItem>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TimNguoiKhac;
