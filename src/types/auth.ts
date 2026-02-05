/**
 * 인증 관련 타입 정의
 */

export interface ProfileFromPhone {
  id: string;
  phone: string;
  nickname: string | null;
  avatar_url: string | null;
  role: 'user';
}
