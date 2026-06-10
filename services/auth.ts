import { api } from '../lib/api';

type SignupPayload = {
  name: string;
  loginId: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export async function signup(payload: SignupPayload) {
  const { data } = await api.post('/api/signup', payload);
  return data.user;
}
