import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export async function analyze(payload) {
  const { data } = await axios.post(`${API}/analyze`, payload);
  return data;
}

export async function addHistory(expression) {
  const { data } = await axios.post(`${API}/history`, { expression });
  return data;
}

export async function listHistory() {
  const { data } = await axios.get(`${API}/history?limit=30`);
  return data;
}

export async function deleteHistory(id) {
  await axios.delete(`${API}/history/${id}`);
}

export async function clearHistory() {
  await axios.delete(`${API}/history`);
}
