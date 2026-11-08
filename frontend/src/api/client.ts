import axios from 'axios';
import { getDeviceId } from '@/utils/deviceId';

// Axios 인스턴스 생성
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청에 X-Device-Id 헤더를 자동 추가
client.interceptors.request.use((config) => {
  config.headers['X-Device-Id'] = getDeviceId();
  return config;
});

// 응답 인터셉터: 공통 에러 처리
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const detail = data?.detail || '알 수 없는 오류';

      if (status === 500) {
        console.error(`[API] 서버 오류 (500): ${detail}`);
      } else if (status === 401 || status === 403) {
        console.warn(`[API] 인증/권한 오류 (${status}): ${detail}`);
      }
    } else {
      console.error('[API] 네트워크 오류:', error.message);
    }

    return Promise.reject(error);
  },
);

export default client;
