import client from './client';

export interface DeviceInfo {
  device_id: string;
  nickname: string | null;
}

export interface UpdateNicknameResponse {
  success: boolean;
  nickname: string;
  message: string;
}

/**
 * 내 디바이스 정보 조회
 */
export const getMyDeviceInfo = async (): Promise<DeviceInfo> => {
  if (import.meta.env.VITE_SINGLE_FILE) {
    // localStorage 모드에서는 로컬 스토리지에서 닉네임 가져오기
    const nickname = localStorage.getItem('ggumul_nickname');
    return {
      device_id: 'local-device',
      nickname: nickname || null,
    };
  }

  const response = await client.get('/devices/me');
  return response.data;
};

/**
 * 내 닉네임 설정/수정
 */
export const updateMyNickname = async (nickname: string): Promise<UpdateNicknameResponse> => {
  if (import.meta.env.VITE_SINGLE_FILE) {
    // localStorage 모드에서는 로컬 스토리지에 닉네임 저장
    localStorage.setItem('ggumul_nickname', nickname);
    return {
      success: true,
      nickname: nickname,
      message: '닉네임이 설정되었습니다.',
    };
  }

  const response = await client.put('/devices/me/nickname', { nickname });
  return response.data;
};
