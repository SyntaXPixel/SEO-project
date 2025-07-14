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

// Keyword Planner API
export const fetchKeywordPlannerResults = async (mode, input) => {
  const response = await API.post('/keyword-planner', { mode, input });
  return response.data;
};

// Content Optimizer API
export async function analyzeContent(html, keyword) {
  const res = await fetch('/api/content-optimizer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, keyword })
  });
  if (!res.ok) throw new Error('Failed to analyze content');
  return await res.json();
}

// Content Rewrite API
export async function rewriteContent(html) {handleGenerateContentWriter
  const res = await fetch('/api/content-rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html })
  });
  if (!res.ok) throw new Error('Failed to rewrite content');
  return await res.json();
}

// Content Analyze API (for rewritten text)
export async function analyzeTextContent(text, keyword) {
  const res = await fetch('/api/content-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, keyword })
  });
  if (!res.ok) throw new Error('Failed to analyze text content');
  return await res.json();
}

// AI Content Writer API
export const generateContent = async (topic, tone, length) => {
  console.log(topic, tone, length);
  const res = await fetch('/api/content-writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, tone, length }),
  });

  return await res.json();
};

export default API;
