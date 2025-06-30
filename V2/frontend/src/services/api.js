import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5001/api", // ✅ Important: Must match your backend
});

// Add user ID to all requests
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user._id) {
    config.headers['User-ID'] = user._id;
  }
  return config;
});

export default API;
