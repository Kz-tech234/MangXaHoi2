import React, { useContext, useReducer } from 'react';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import các component màn hình
import Home from './components/Home/Home';
import Login from './components/User/Login';
import Register from './components/User/Register';
import ChiTietBaiDang from './components/Home/ChiTietBaiDang';
import TrangCaNhan from "./components/Home/TrangCaNhan";
import Profile from './components/User/Profile';
import CreatePost from "./components/Home/CreatePost";
import TimNguoiKhac from './components/Home/TimNguoiKhac';
import Notifications from './components/Home/Notifications';
import Surveys from './components/Home/Surveys';
import SurveyDetail from "./components/Home/SurveyDetail";
import ChangePassword from './components/User/ChangePassword';


// Import context và reducer
import { MyDispatchContext, MyUserContext } from './configs/MyUserContext';
import MyUserReducers from './configs/MyUserReducers';

// Firebase
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';


// Kiểm tra và chỉ khởi tạo Firebase nếu chưa có instance nào
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const database = getDatabase(app);
const analytics = getAnalytics(app);

export { app, auth, database, analytics };

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} options={{ title: "Trang chính" }} />
      <Stack.Screen name="ChiTietBaiDang" component={ChiTietBaiDang} options={{ title: "Chi tiết bài đăng" }} />
      <Stack.Screen name="TrangCaNhan" component={TrangCaNhan} options={{ title: "Trang cá nhân" }} />
      <Stack.Screen name="CreatePost" component={CreatePost} options={{ title: "Tạo bài đăng" }} />
      <Stack.Screen name="TimNguoiKhac" component={TimNguoiKhac} options={{ title: "Tìm người dùng" }} />
    </Stack.Navigator>
  );
};


const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={Profile} options={{ title: "Tài khoản" }} />
      <Stack.Screen name="ChiTietBaiDang" component={ChiTietBaiDang} options={{ title: "Chi tiết bài đăng" }} />
      <Stack.Screen name="TrangCaNhan" component={TrangCaNhan} options={{ title: "Trang cá nhân" }} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: "Thay đổi mật khẩu" }} />
    </Stack.Navigator>
  );
};


// Stack Navigator cho Thông báo
const NotificationStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Notification" component={Notifications} options={{ title: "Thông báo" }} />
    </Stack.Navigator>
  );
};

// Stack Navigator cho Khảo sát
const SurveysStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Surveys" component={Surveys} options={{ title: "Khảo sát" }} />
      <Stack.Screen name="SurveyDetail" component={SurveyDetail} options={{ title: "Chi tiết khảo sát" }} />
    </Stack.Navigator>
  );
};

const resetStackOnTabPress = (navigation, e) => {
  const state = navigation.getState();
  if (state) {
    state.routes.forEach((route) => {
      if (route.key !== e.target && route.state?.key) {
        navigation.dispatch({ ...StackActions.popToTop(), target: route.state.key });
      }
    });
  }
};

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
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-check" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Register"
            component={Register}
            options={{
              title: "Đăng ký",
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-plus" color={color} size={size} />
              ),
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
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="home-account" color={color} size={size} />
              ),
              listeners: {
                tabPress: (e) => resetStackOnTabPress(navigation, e),
              },
            }}
          />
          <Tab.Screen
            name="Notification"
            component={NotificationStackNavigator}
            options={{
              title: "Thông báo",
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="bell" color={color} size={size} />
              ),
              listeners: {
                tabPress: (e) => resetStackOnTabPress(navigation, e),
              },
            }}
          />
          <Tab.Screen
            name="Surveys"
            component={SurveysStackNavigator}
            options={{
              title: "Khảo sát",
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="clipboard-list" color={color} size={size} />
              ),
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
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account" color={color} size={size} />
              ),
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
