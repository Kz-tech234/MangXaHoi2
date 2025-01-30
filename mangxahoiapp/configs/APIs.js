import axios from "axios";

const BASE_URL = "https://chickenphong.pythonanywhere.com";


export const endpoints = {
    'baidangs': '/baidangs/',
    'login': '/o/token/',
    'current-user': '/users/current-user/', 
    'register': '/users/',
    'userDetail': '/users/',
    'thongbaosukiens': '/thongbaosukiens/',  // API cho thông báo
    'khaosats': '/khaosats/',  // API cho khảo sát
}

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type': 'application/json', 
        }
    });
}

export default axios.create({
    baseURL: BASE_URL
});
