import axios from 'axios';
import { getToken } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
