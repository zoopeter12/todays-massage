/**
 * Admin Log Helper Utilities
 * 관리자 작업 로그 기록을 위한 유틸리티 함수
 */

import { createAdminLog } from '@/lib/api/admin-logs';

/**
 * 관리자 정보 타입
 */
export interface AdminInfo {
  id: string;
  name: string;
}

/**
 * 관리자 정보 검증 헬퍼 함수
 * @param admin - 관리자 정보 객체
 * @returns 검증된 관리자 정보
 * @throws Error 관리자 정보가 유효하지 않은 경우
 */
function validateAdminInfo(admin: AdminInfo): AdminInfo {
  if (!admin.id || !admin.name) {
    throw new Error(
      '관리자 정보가 유효하지 않습니다. id와 name이 필요합니다. ' +
      '관리자 페이지에서는 useSession() 또는 auth()를 통해 현재 로그인한 관리자 정보를 가져와 전달하세요.'
    );
  }
  return admin;
}

/**
 * 회원 관련 작업 로그
 */
export const userLog = {
  /**
   * 회원 정지 로그
   * @param userId - 정지할 회원 ID
   * @param reason - 정지 사유
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  suspend: async (userId: string, reason: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'user.suspend',
      targetType: 'user',
      targetId: userId,
      details: { reason }
    });
  },

  /**
   * 회원 삭제 로그
   * @param userId - 삭제할 회원 ID
   * @param reason - 삭제 사유
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  delete: async (userId: string, reason: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'user.delete',
      targetType: 'user',
      targetId: userId,
      details: { reason }
    });
  },

  /**
   * 권한 변경 로그
   * @param userId - 권한을 변경할 회원 ID
   * @param oldRole - 변경 전 권한
   * @param newRole - 변경 후 권한
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  roleChange: async (userId: string, oldRole: string, newRole: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'user.role_change',
      targetType: 'user',
      targetId: userId,
      details: { old_role: oldRole, new_role: newRole }
    });
  }
};

/**
 * 매장 관련 작업 로그
 */
export const shopLog = {
  /**
   * 매장 승인 로그
   * @param shopId - 승인할 매장 ID
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   * @param notes - 승인 메모 (선택)
   */
  approve: async (shopId: string, admin: AdminInfo, notes?: string) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'shop.approve',
      targetType: 'shop',
      targetId: shopId,
      details: { notes }
    });
  },

  /**
   * 매장 반려 로그
   * @param shopId - 반려할 매장 ID
   * @param reason - 반려 사유
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  reject: async (shopId: string, reason: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'shop.reject',
      targetType: 'shop',
      targetId: shopId,
      details: { reason }
    });
  },

  /**
   * 매장 정지 로그
   * @param shopId - 정지할 매장 ID
   * @param reason - 정지 사유
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  suspend: async (shopId: string, reason: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'shop.suspend',
      targetType: 'shop',
      targetId: shopId,
      details: { reason }
    });
  }
};

/**
 * 정산 관련 작업 로그
 */
export const settlementLog = {
  /**
   * 정산 처리 로그
   * @param settlementId - 정산 ID
   * @param amount - 정산 금액
   * @param bankInfo - 은행 정보
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  process: async (settlementId: string, amount: number, bankInfo: { bank: string; account: string }, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'settlement.process',
      targetType: 'settlement',
      targetId: settlementId,
      details: {
        amount,
        bank: bankInfo.bank,
        account: bankInfo.account.slice(-4).padStart(bankInfo.account.length, '*')
      }
    });
  },

  /**
   * 정산 승인 로그
   * @param settlementId - 정산 ID
   * @param amount - 정산 금액
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  approve: async (settlementId: string, amount: number, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'settlement.approve',
      targetType: 'settlement',
      targetId: settlementId,
      details: { amount }
    });
  },

  /**
   * 정산 반려 로그
   * @param settlementId - 정산 ID
   * @param reason - 반려 사유
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  reject: async (settlementId: string, reason: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'settlement.reject',
      targetType: 'settlement',
      targetId: settlementId,
      details: { reason }
    });
  }
};

/**
 * 콘텐츠 관련 작업 로그
 */
export const contentLog = {
  /**
   * 콘텐츠 생성 로그
   * @param contentType - 콘텐츠 타입
   * @param contentId - 콘텐츠 ID
   * @param title - 콘텐츠 제목
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  create: async (contentType: string, contentId: string, title: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'content.create',
      targetType: contentType,
      targetId: contentId,
      details: { title }
    });
  },

  /**
   * 콘텐츠 수정 로그
   * @param contentType - 콘텐츠 타입
   * @param contentId - 콘텐츠 ID
   * @param changes - 변경 내용
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  update: async (contentType: string, contentId: string, changes: Record<string, unknown>, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'content.update',
      targetType: contentType,
      targetId: contentId,
      details: { changes }
    });
  },

  /**
   * 콘텐츠 삭제 로그
   * @param contentType - 콘텐츠 타입
   * @param contentId - 콘텐츠 ID
   * @param title - 콘텐츠 제목
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  delete: async (contentType: string, contentId: string, title: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'content.delete',
      targetType: contentType,
      targetId: contentId,
      details: { title }
    });
  },

  /**
   * 콘텐츠 게시 로그
   * @param contentType - 콘텐츠 타입
   * @param contentId - 콘텐츠 ID
   * @param title - 콘텐츠 제목
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  publish: async (contentType: string, contentId: string, title: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'content.publish',
      targetType: contentType,
      targetId: contentId,
      details: { title }
    });
  }
};

/**
 * 신고 관련 작업 로그
 */
export const reportLog = {
  /**
   * 신고 처리 로그
   * @param reportId - 신고 ID
   * @param resolution - 처리 결과
   * @param actionTaken - 조치 내용
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  resolve: async (reportId: string, resolution: string, actionTaken: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'report.resolve',
      targetType: 'report',
      targetId: reportId,
      details: { resolution, action_taken: actionTaken }
    });
  },

  /**
   * 신고 기각 로그
   * @param reportId - 신고 ID
   * @param reason - 기각 사유
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  dismiss: async (reportId: string, reason: string, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'report.dismiss',
      targetType: 'report',
      targetId: reportId,
      details: { reason }
    });
  }
};

/**
 * 시스템 설정 관련 작업 로그
 */
export const configLog = {
  /**
   * 설정 변경 로그
   * @param configKey - 설정 키
   * @param oldValue - 변경 전 값
   * @param newValue - 변경 후 값
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  update: async (configKey: string, oldValue: unknown, newValue: unknown, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'config.update',
      targetType: 'config',
      targetId: configKey,
      details: { old_value: oldValue, new_value: newValue }
    });
  },

  /**
   * 점검 모드 전환 로그
   * @param enabled - 점검 모드 활성화 여부
   * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
   */
  maintenanceMode: async (enabled: boolean, admin: AdminInfo) => {
    const validAdmin = validateAdminInfo(admin);
    return createAdminLog({
      adminId: validAdmin.id,
      adminName: validAdmin.name,
      action: 'system.maintenance',
      targetType: 'system',
      targetId: 'maintenance_mode',
      details: { enabled }
    });
  }
};

/**
 * 통합 로그 기록 함수
 * 모든 로그를 하나의 함수로 기록
 *
 * @param action - 액션 타입
 * @param targetType - 대상 타입
 * @param targetId - 대상 ID
 * @param admin - 관리자 정보 (세션에서 가져온 현재 로그인한 관리자)
 * @param details - 추가 세부 정보 (선택)
 */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId: string,
  admin: AdminInfo,
  details?: Record<string, unknown>
) {
  const validAdmin = validateAdminInfo(admin);
  return createAdminLog({
    adminId: validAdmin.id,
    adminName: validAdmin.name,
    action,
    targetType,
    targetId,
    details
  });
}
