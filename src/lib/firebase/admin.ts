/**
 * Firebase Admin SDK 서버사이드 설정
 * 푸시 알림 발송을 위한 서버 전용 모듈
 */
import * as admin from 'firebase-admin';

// Firebase Admin 앱 초기화 (싱글톤 패턴)
function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // 환경변수에서 서비스 계정 정보 로드
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Base64로 인코딩된 private key 디코딩
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // 필수 환경변수 검증
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error(
      'Firebase Admin SDK 환경변수가 설정되지 않았습니다. ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY를 확인하세요.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Firebase Messaging 인스턴스 가져오기
export function getMessaging(): admin.messaging.Messaging {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
}

// Firebase Admin 앱 인스턴스 가져오기
export function getAdminApp(): admin.app.App {
  return getFirebaseAdmin();
}

export { admin };
