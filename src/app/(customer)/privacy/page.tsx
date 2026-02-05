import { Metadata } from "next";
import Link from "next/link";
import { Shield, Mail, Phone, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 오늘의마사지",
  description: "오늘의마사지 개인정보처리방침 - 고객님의 개인정보를 안전하게 보호합니다.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-sm">
        {/* Header Section */}
        <section className="bg-white px-4 py-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200">
              <Shield className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                개인정보처리방침
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Privacy Policy
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            오늘의마사지는 고객님의 개인정보를 소중하게 생각하며, 개인정보보호법 및 정보통신망 이용촉진 및 정보보호 등에 관한 법률을 준수하고 있습니다.
          </p>
        </section>

        {/* Table of Contents */}
        <section className="bg-white px-4 py-6 mt-2 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">목차</h2>
          <nav className="space-y-2">
            {[
              { id: "section1", title: "1. 개인정보의 수집 항목 및 방법" },
              { id: "section2", title: "2. 개인정보의 수집 및 이용 목적" },
              { id: "section3", title: "3. 개인정보의 보유 및 이용 기간" },
              { id: "section4", title: "4. 개인정보의 제3자 제공" },
              { id: "section5", title: "5. 개인정보 처리 위탁" },
              { id: "section6", title: "6. 이용자의 권리와 행사 방법" },
              { id: "section7", title: "7. 개인정보 자동 수집 장치" },
              { id: "section8", title: "8. 개인정보 보호책임자" },
              { id: "section9", title: "9. 고충처리 부서" },
              { id: "section10", title: "10. 개인정보 처리방침 변경" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
              >
                <span>{item.title}</span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
              </a>
            ))}
          </nav>
        </section>

        {/* Content Sections */}
        <div className="px-4 py-6 space-y-4">
          {/* Section 1 */}
          <Card id="section1" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                1. 개인정보의 수집 항목 및 방법
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-2">
                    가. 수집 항목
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        필수 항목
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>회원가입: 휴대전화번호 (본인인증을 통한 가입)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>본인인증: CI (연계정보), DI (중복가입확인정보)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>예약 서비스: 예약자명, 연락처, 예약일시, 요청사항</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>결제 서비스: 결제정보 (신용카드 정보, 계좌번호 등)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        선택 항목
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>닉네임, 프로필 사진</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>마케팅 알림 수신 동의 여부 (푸시 알림, 알림톡)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>위치 정보 (근처 매장 검색 서비스 이용 시)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        자동 수집 정보
                      </h4>
                      <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>기기 정보 (OS, 브라우저 종류, 화면 크기 등)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">•</span>
                          <span>위치 정보 (선택 동의 시)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-2">
                    나. 수집 방법
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>다날 PASS 본인인증을 통한 휴대전화번호 및 CI/DI 자동 수집</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>홈페이지 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>모바일 앱 설치 및 이용 과정에서 자동 수집</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>고객센터 상담 과정에서 이메일, 전화, 채팅 등을 통한 수집</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>이벤트 및 프로모션 참여 시 수집</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card id="section2" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                2. 개인정보의 수집 및 이용 목적
              </h2>

              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    가. 회원 관리
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>휴대전화번호: 회원 가입 및 본인 확인, 예약 알림 및 고지사항 전달</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>CI/DI: 본인 확인, 중복 가입 방지, 부정 이용 방지, 블랙리스트 관리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>가입 의사 확인, 연령 확인, 불만 처리 등 민원 처리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>회원 탈퇴 의사 확인</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    나. 서비스 제공
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>마사지/스파 업체 정보 제공 및 예약 서비스 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>예약 확인 및 변경, 취소 처리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>포인트 및 쿠폰 관리, 이벤트 참여 기회 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>리뷰 작성 및 관리 서비스 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>위치 기반 서비스 제공 (주변 업체 검색)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    다. 결제 및 환불
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>상품 및 서비스 결제, 요금 정산</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>환불 처리 및 분쟁 조정</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    라. 마케팅 및 광고 (선택 동의 시)
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>신규 서비스 개발 및 맞춤 서비스 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>이벤트 및 프로모션 정보 안내</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>서비스 이용에 대한 통계 분석</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card id="section3" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                3. 개인정보의 보유 및 이용 기간
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    가. 회원 정보
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-pink-500 mt-0.5 font-semibold">•</span>
                      <div className="flex-1">
                        <p className="text-slate-700 font-medium">휴대전화번호, 닉네임, 프로필: 회원 탈퇴 시까지</p>
                        <p className="text-slate-600 text-xs mt-1">
                          단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-pink-500 mt-0.5 font-semibold">•</span>
                      <div className="flex-1">
                        <p className="text-slate-700 font-medium">CI (연계정보), DI (중복가입확인정보): 회원 탈퇴 후 1년</p>
                        <p className="text-slate-600 text-xs mt-1">
                          중복 가입 방지, 부정 이용 방지, 블랙리스트 관리를 위해 탈퇴 후 1년간 보관 후 즉시 파기
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-pink-500 mt-0.5 font-semibold">•</span>
                      <div className="flex-1">
                        <p className="text-slate-700 font-medium">예약/결제 정보: 전자상거래법에 따라 5년</p>
                        <p className="text-slate-600 text-xs mt-1">
                          계약·청약철회, 대금결제, 재화공급 기록은 5년 보관
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    나. 법령에 따른 보존
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1.5">
                        전자상거래 등에서의 소비자보호에 관한 법률
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">-</span>
                          <span>계약 또는 청약철회 등에 관한 기록: 5년</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">-</span>
                          <span>대금결제 및 재화 등의 공급에 관한 기록: 5년</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">-</span>
                          <span>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1.5">
                        통신비밀보호법
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">-</span>
                          <span>웹사이트 방문 기록: 3개월</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1.5">
                        전자금융거래법
                      </p>
                      <ul className="text-sm text-slate-600 space-y-1 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-pink-500 mt-0.5">-</span>
                          <span>전자금융 거래에 관한 기록: 5년</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong className="font-semibold">참고:</strong> 회원 탈퇴 즉시 개인정보는 파기됩니다. 단, 위 관계 법령에 의해 보존이 필요한 경우 해당 정보를 별도 분리 보관합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card id="section4" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                4. 개인정보의 제3자 제공
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
                </p>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    가. 이용자의 사전 동의가 있는 경우
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    서비스 제공을 위해 필요한 최소한의 정보를 아래와 같이 제공합니다.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-semibold text-slate-700">제공받는 자</th>
                          <th className="text-left py-2 font-semibold text-slate-700">제공 항목</th>
                          <th className="text-left py-2 font-semibold text-slate-700">제공 목적</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-600">다날 (본인인증 기관)</td>
                          <td className="py-2 text-slate-600">휴대전화번호</td>
                          <td className="py-2 text-slate-600">본인인증 및 CI/DI 생성</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-600">제휴 업체 (매장)</td>
                          <td className="py-2 text-slate-600">예약자명, 연락처, 예약일시</td>
                          <td className="py-2 text-slate-600">예약 확인 및 서비스 제공</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    나. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
                  </h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <strong className="font-semibold">알림:</strong> 제3자 제공 시 제공받는 자, 제공 목적, 제공 항목, 보유 및 이용 기간을 사전에 고지하고 동의를 받습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card id="section5" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                5. 개인정보 처리 위탁
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 외부 전문업체에 위탁하여 운영하고 있습니다.
                </p>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">수탁업체</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">위탁 업무 내용</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 text-slate-700">다날 (본인인증)</td>
                        <td className="px-4 py-3 text-slate-600">휴대전화 본인인증 서비스 제공</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-700">PortOne (결제대행)</td>
                        <td className="px-4 py-3 text-slate-600">전자결제 서비스 제공</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-700">카카오 (알림톡)</td>
                        <td className="px-4 py-3 text-slate-600">예약 확인, 변경 알림 발송</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-700">Firebase / Supabase</td>
                        <td className="px-4 py-3 text-slate-600">데이터 보관 및 관리</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    위탁 관리
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>위탁 계약 시 개인정보보호법에 따라 위탁 업무 수행 목적 외 개인정보 처리 금지</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>개인정보의 기술적·관리적 보호조치 의무화</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>위탁 업무의 내용과 수탁자를 개인정보처리방침을 통해 공개</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>수탁자가 변경될 경우 지체없이 본 개인정보 처리방침을 통해 공개</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card id="section6" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                6. 이용자의 권리와 행사 방법
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.
                </p>

                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      가. 개인정보 열람 요구
                    </h3>
                    <p className="text-sm text-slate-600">
                      본인의 개인정보에 대한 열람을 요구할 수 있습니다.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      나. 개인정보 정정·삭제 요구
                    </h3>
                    <p className="text-sm text-slate-600">
                      잘못된 개인정보에 대해 정정 또는 삭제를 요구할 수 있습니다. 단, 다른 법령에서 개인정보가 수집 대상으로 명시되어 있는 경우에는 삭제를 요구할 수 없습니다.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      다. 개인정보 처리 정지 요구
                    </h3>
                    <p className="text-sm text-slate-600">
                      개인정보의 처리 정지를 요구할 수 있습니다.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      라. 권리 행사 방법
                    </h3>
                    <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">•</span>
                        <span>마이페이지를 통한 직접 수정 또는 삭제</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">•</span>
                        <span>개인정보 보호책임자에게 서면, 전화, 이메일로 연락</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-500 mt-0.5">•</span>
                        <span>회사는 요청에 대해 지체 없이 조치하겠습니다</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong className="font-semibold">참고:</strong> 만 14세 미만 아동의 경우, 법정대리인이 아동의 개인정보를 조회하거나 수정, 삭제, 처리정지를 요구할 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card id="section7" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                7. 개인정보 자동 수집 장치
              </h2>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    가. 쿠키(Cookie)의 사용
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    회사는 이용자에게 개인화되고 맞춤화된 서비스를 제공하기 위해 쿠키를 사용합니다.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">쿠키란?</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에 보내는 아주 작은 텍스트 파일로, 이용자의 컴퓨터 하드디스크에 저장됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    나. 쿠키 사용 목적
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>로그인 상태 유지 및 자동 로그인</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>이용자의 관심 분야에 따른 맞춤 서비스 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>서비스 이용 통계 분석 및 개선</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>접속 빈도나 방문 시간 등 분석</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    다. 쿠키 설정 거부 방법
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">
                    이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다.
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1.5 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>웹브라우저 옵션 설정을 통해 쿠키 허용 또는 거부 가능</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>Chrome: 설정 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트 데이터</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>Safari: 환경설정 &gt; 개인정보 &gt; 쿠키 및 웹사이트 데이터</span>
                    </li>
                  </ul>
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong className="font-semibold">주의:</strong> 쿠키 설치를 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card id="section8" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                8. 개인정보 보호책임자
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>

                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Shield className="h-7 w-7 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-3">
                        개인정보 보호책임자
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-slate-500 w-16 flex-shrink-0">성명</span>
                          <span className="text-sm text-slate-700 font-medium">홍길동</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-slate-500 w-16 flex-shrink-0">직책</span>
                          <span className="text-sm text-slate-700">개인정보보호팀장</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-slate-500 w-16 flex-shrink-0">연락처</span>
                          <div className="flex flex-col gap-1">
                            <a
                              href="tel:02-1234-5678"
                              className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              02-1234-5678
                            </a>
                            <a
                              href="mailto:privacy@todaymassage.com"
                              className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              privacy@todaymassage.com
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <strong className="font-semibold">알림:</strong> 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>대검찰청 사이버범죄수사단: (국번없이) 1301 (www.spo.go.kr)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>경찰청 사이버안전국: (국번없이) 182 (cyberbureau.police.go.kr)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card id="section9" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                9. 고충처리 부서
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.
                </p>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Mail className="h-7 w-7 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-3">
                        고객지원센터
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-slate-500 w-16 flex-shrink-0">부서명</span>
                          <span className="text-sm text-slate-700 font-medium">고객지원팀</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-slate-500 w-16 flex-shrink-0">연락처</span>
                          <div className="flex flex-col gap-1">
                            <a
                              href="tel:1234-5678"
                              className="flex items-center gap-2 text-sm text-slate-600 hover:text-pink-600 font-medium transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              1234-5678
                            </a>
                            <a
                              href="mailto:support@todaymassage.com"
                              className="flex items-center gap-2 text-sm text-slate-600 hover:text-pink-600 font-medium transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              support@todaymassage.com
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-slate-500 w-16 flex-shrink-0">운영시간</span>
                          <span className="text-sm text-slate-700">평일 09:00 ~ 18:00 (주말/공휴일 제외)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 10 */}
          <Card id="section10" className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                10. 개인정보 처리방침 변경
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    개정 이력
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 pb-2 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-500 w-24 flex-shrink-0">버전 1.0</span>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 font-medium">2025년 1월 26일</p>
                        <p className="text-sm text-slate-600 mt-0.5">최초 시행</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="text-sm text-pink-800 leading-relaxed">
                    <strong className="font-semibold">공고일자:</strong> 2025년 1월 26일<br />
                    <strong className="font-semibold">시행일자:</strong> 2025년 1월 26일
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <section className="bg-white px-4 py-8 mt-2 shadow-sm">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-4">
              개인정보 처리방침에 대해 궁금한 점이 있으신가요?
            </p>
            <Link
              href="/customer-support"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
            >
              <Mail className="h-4 w-4" />
              고객센터 문의하기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
