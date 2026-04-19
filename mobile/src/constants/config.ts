
export const API_CONFIG = {
  BASE_URL: __DEV__
    // ? 'http://10.0.2.2:8080/api/v1' // Android emulator
    ? 'http://192.168.1.133:8081/api/v1' // Physical device on same network
    : 'https://api.grabeat.com/api/v1', // Production
  TIMEOUT: 30000,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
} as const;
