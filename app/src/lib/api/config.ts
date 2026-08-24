const DEVELOPMENT_BASE_URL = "http://192.168.0.14:8080";
const PRODUCTION_BASE_URL = "https://api.jipkok.app";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (__DEV__ ? DEVELOPMENT_BASE_URL : PRODUCTION_BASE_URL);
