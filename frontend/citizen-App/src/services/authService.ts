import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";
import { saveToken, removeToken } from "../utils/tokenStorage";

const USER_KEY = "@citylens_user";

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id: number;
  role: string;
  name: string;
  email: string;
};

export async function login(data: LoginData): Promise<AuthUser> {
  // FastAPI's OAuth2 login expects form fields called "username" + "password"
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    form: {
      username: data.email.trim().toLowerCase(),
      password: data.password,
    },
  });

  await saveToken(response.access_token);

  const user: AuthUser = {
    id: response.user_id,
    name: response.name,
    email: response.email,
    role: response.role,
  };

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

  return user;
}

export async function register(data: RegisterData): Promise<void> {
  await apiRequest("/auth/register", {
    method: "POST",
    auth: false,
    body: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    },
  });
}

export async function getSavedUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function logout(): Promise<void> {
  await removeToken();
  await AsyncStorage.removeItem(USER_KEY);
}
