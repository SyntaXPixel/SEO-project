import axios from "axios";

const API = axios.create({
  baseURL: "/api", // Use relative path to enable proxy!
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
