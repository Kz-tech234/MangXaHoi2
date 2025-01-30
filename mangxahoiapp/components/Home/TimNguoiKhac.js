import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, StyleSheet } from "react-native";
import { ListItem, Avatar } from "react-native-elements";
import { useNavigation } from "@react-navigation/native"; 

const TimNguoiKhac = () => {
  const [searchQuery, setSearchQuery] = useState(''); 
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users, setUsers] = useState([]); 
  const navigation = useNavigation(); 

 
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://chickenphong.pythonanywhere.com/users/");
        const data = await response.json();
        setUsers(data); 
        setFilteredUsers(data); 
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []); 

  
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = users.filter(user => user.username.toLowerCase().includes(query.toLowerCase()));
    setFilteredUsers(filtered);
  };

 
  const handleUserPress = (userId) => {
    navigation.navigate("TrangCaNhan", { userId });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm theo username"
        value={searchQuery}
        onChangeText={handleSearch} 
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ListItem bottomDivider onPress={() => handleUserPress(item.id)}>
           
            <Avatar 
              rounded 
              size="medium" 
              source={{ uri: item.image ? `chickenphong.pythonanywhere.com${item.image}` : "https://cbam.edu.vn/wp-content/uploads/2024/10/avatar-mac-dinh-30xJKPDu.jpg" }} 
            />
            <ListItem.Content>
              <Text>{item.first_name} {item.last_name}</Text>
              <Text>{item.username}</Text>
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
});

export default TimNguoiKhac;
