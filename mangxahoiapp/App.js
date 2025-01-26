// Import các thư viện cần thiết

import React, { useContext, useReducer } from 'react';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from "react-native-paper";

// Import các component màn hình
import Home from './components/Home/Home';
import Login from './components/User/Login';
import Register from './components/User/Register';
// import UserProfile from "./components/User/Profile";
import TimNguoiKhac  from './components/Home/TimNguoiKhac';
import ChiTietBaiDang from "./components/Home/ChiTietBaiDang";
import TrangCaNhan from "./components/Home/TrangCaNhan";
// import TimTro from "./components/Home/TimTro";

// import QuanLyTro from "./components/Home/QuanLyTro"; 
// import ThemTro from "./components/Home/ThemTro"; 
// import ChiTietTro from "./components/Home/ChiTietTro"; 

// Import context và reducer
import { MyDispatchContext, MyUserContext } from './configs/MyUserContext';
import MyUserReducers from './configs/MyUserReducers';
import Profile from './components/User/Profile';

// Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Authentication
import { getDatabase } from 'firebase/database'; // Realtime Database
import { getAnalytics } from 'firebase/analytics';

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBA71OL95JtgK6ryUbXqQvGDsTSf9ZMCQg",
  authDomain: "mangxahoi-44414.firebaseapp.com",
  databaseURL: "https://mangxahoi-44414-default-rtdb.firebaseio.com",
  projectId: "mangxahoi-44414",
  storageBucket: "mangxahoi-44414.firebasestorage.app",
  messagingSenderId: "688491545111",
  appId: "1:688491545111:web:8fc105336be5636af45252",
  measurementId: "G-ZK4R19M4JK"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ Firebase mà bạn cần
const auth = getAuth(app); // Authentication
const database = getDatabase(app); // Realtime Database
const analytics = getAnalytics(app); // Analytics (nếu bạn cần)

export { app, auth, database, analytics };


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ title: "Trang chính" }}
      />
      <Stack.Screen
        name="ChiTietBaiDang"
        component={ChiTietBaiDang}
        options={{ title: "Chi tiết bài đăng" }}
      />
      <Stack.Screen
        name="TimNguoiKhac"
        component={TimNguoiKhac}
        options={{ title: "Tìm người khác" }}
      />
      <Stack.Screen
        name="TrangCaNhan"
        component={TrangCaNhan}
        options={{ title: "Trang cá nhân" }}
      />

    </Stack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Tài khoản" }}
      />
      <Stack.Screen
        name="ChiTietBaiDang"
        component={ChiTietBaiDang}
        options={{ title: "Chi tiết bài đăng" }}
      />
      <Stack.Screen
        name="TrangCaNhan"
        component={TrangCaNhan}
        options={{ title: "Trang cá nhân" }}
      />

    </Stack.Navigator>
  );
};

const resetStackOnTabPress = (navigation, e) => {
  const state = navigation.dangerouslyGetState();
  if (state) {
    const nonTargetTabs = state.routes.filter((r) => r.key !== e.target);
    nonTargetTabs.forEach((tab) => {
      if (tab?.state?.key) {
        navigation.dispatch({ ...StackActions.popToTop(), target: tab?.state?.key });
      }
    });
  }
};

// Tạo TabNavigator
const TabNavigator = ({ navigation }) => {
  const user = useContext(MyUserContext);

  return (
    <Tab.Navigator>
      {user === null ? (
        <>
          <Tab.Screen
            name="Login"
            component={Login}
            options={{
              title: "Đăng nhập",
              tabBarIcon: () => <Icon source="account-check" size={20} />
            }}
          />
          <Tab.Screen
            name="Register"
            component={Register}
            options={{
              title: "Đăng ký",
              tabBarIcon: () => <Icon source="account-plus" size={20} />
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="HomeStack"
            component={HomeStackNavigator}
            options={{
              title: "Trang chủ",
              headerShown: false,
              tabBarIcon: () => <Icon source="home-account" size={20} />,
              listeners: {
                tabPress: (e) => resetStackOnTabPress(navigation, e),
              },
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileStackNavigator}
            options={{
              title: "Tài khoản",
              headerShown: false,
              tabBarIcon: () => <Icon source="account-check" size={20} />,
              listeners: {
                tabPress: (e) => resetStackOnTabPress(navigation, e),
              },
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

// App chính
export default function App() {
  const [user, dispatch] = useReducer(MyUserReducers, null);

  return (
    <NavigationContainer>
      <MyUserContext.Provider value={user}>
        <MyDispatchContext.Provider value={dispatch}>
          <TabNavigator />
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </NavigationContainer>
  );
}