import { Metadata } from "next";
import { FileText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "이용약관 | 오늘의마사지",
  description: "오늘의마사지 서비스 이용약관을 확인하세요.",
  keywords: ["이용약관", "서비스약관", "오늘의마사지", "마사지예약"],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-sm">
        {/* Header */}
        <div className="bg-white px-4 py-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
              <FileText className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">이용약관</h1>
              <p className="text-sm text-slate-500">
                오늘의마사지 서비스 이용 약관
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4 pb-10">
          {/* 제1조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제1조 (목적)
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                본 약관은 오늘의마사지(이하 &quot;회사&quot;)가 제공하는 마사지/스파 예약 플랫폼 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 서비스 이용조건 및 절차 등을 규정함을 목적으로 합니다.
              </p>
            </CardContent>
          </Card>

          {/* 제2조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제2조 (용어의 정의)
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ul className="ml-4 space-y-1.5">
                  <li className="list-decimal">
                    &quot;서비스&quot;란 회사가 제공하는 마사지/스파 업체 정보 제공, 예약 중개, 결제 대행 등의 통합 서비스를 말합니다.
                  </li>
                  <li className="list-decimal">
                    &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
                  </li>
                  <li className="list-decimal">
                    &quot;회원&quot;이란 서비스에 가입하여 지속적으로 서비스를 이용할 수 있는 자를 말합니다.
                  </li>
                  <li className="list-decimal">
                    &quot;업체&quot;란 서비스를 통해 마사지/스파 서비스를 제공하는 사업자를 말합니다.
                  </li>
                  <li className="list-decimal">
                    &quot;포인트&quot;란 서비스 이용 시 적립되거나 사용할 수 있는 사이버 자산을 말합니다.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 제3조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제3조 (회원가입 및 탈퇴)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 회원가입</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
                    </li>
                    <li className="list-disc">
                      회사는 가입신청자의 신청에 대하여 승낙함을 원칙으로 하나, 다음 각 호의 경우 승낙을 거부하거나 유보할 수 있습니다:
                      <ul className="ml-4 mt-1 space-y-0.5">
                        <li className="list-circle">가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                        <li className="list-circle">실명이 아니거나 타인의 명의를 이용한 경우</li>
                        <li className="list-circle">허위 정보를 기재하거나 회사가 제시하는 내용을 기재하지 않은 경우</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 회원탈퇴</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      회원은 언제든지 회원탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.
                    </li>
                    <li className="list-disc">
                      탈퇴 시 회원정보는 개인정보처리방침에 따라 처리되며, 미사용 포인트 및 쿠폰은 자동 소멸됩니다.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제4조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제4조 (예약 및 결제)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 예약</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      이용자는 서비스를 통해 원하는 업체, 코스, 날짜 및 시간을 선택하여 예약할 수 있습니다.
                    </li>
                    <li className="list-disc">
                      예약 확정은 업체의 승인을 통해 완료되며, 승인 전까지는 예약이 확정되지 않습니다.
                    </li>
                    <li className="list-disc">
                      업체의 사정에 따라 예약이 거부될 수 있으며, 이 경우 회사는 이용자에게 즉시 통지합니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 결제</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      결제는 신용카드, 체크카드, 간편결제, 포인트 등 회사가 제공하는 결제수단을 통해 이루어집니다.
                    </li>
                    <li className="list-disc">
                      결제 완료 후 예약이 확정되며, 결제 정보는 전자상거래법에 따라 보관됩니다.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제5조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제5조 (플랫폼의 역할 및 책임 범위)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 플랫폼의 역할</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      회사는 이용자와 업체 간의 마사지/스파 서비스 예약을 중개하는 &quot;단순 중개 플랫폼&quot;입니다.
                    </li>
                    <li className="list-disc">
                      회사는 이용자에게 업체 정보, 예약 시스템, 결제 대행 등의 중개 서비스만을 제공합니다.
                    </li>
                    <li className="list-disc">
                      실제 마사지/스파 서비스는 이용자와 업체 간의 직접 계약에 의해 제공되며, 회사는 해당 서비스의 당사자가 아닙니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 직접 계약 관계</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      예약이 확정되면 이용자와 업체 간에 직접적인 서비스 이용 계약이 성립됩니다.
                    </li>
                    <li className="list-disc">
                      서비스의 내용, 품질, 가격, 시간 등 모든 사항은 이용자와 업체 간의 합의에 따릅니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">3. 회사의 책임 범위</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      회사는 업체가 제공하는 마사지/스파 서비스의 품질, 안전성, 적법성 등에 대하여 보증하지 않으며 책임을 지지 않습니다.
                    </li>
                    <li className="list-disc">
                      업체의 서비스로 인해 발생한 신체적, 정신적, 재산적 손해에 대하여 회사는 책임을 지지 않습니다.
                    </li>
                    <li className="list-disc">
                      회사는 플랫폼 시스템의 정상적인 운영과 중개 서비스 제공에 대해서만 책임을 집니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">4. 분쟁 해결 원칙</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      서비스 품질, 시술 결과, 환불 등 업체의 서비스와 관련된 분쟁은 이용자와 업체 간에 직접 해결하여야 합니다.
                    </li>
                    <li className="list-disc">
                      회사는 분쟁 해결을 위한 중재 또는 조정 역할을 할 수 있으나, 이에 대한 법적 의무는 없습니다.
                    </li>
                    <li className="list-disc">
                      분쟁 발생 시 이용자는 업체에 직접 연락하거나 관할 소비자보호기관에 도움을 요청할 수 있습니다.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제6조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제6조 (예약 취소 및 환불 정책)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 취소 시점에 따른 환불 기준</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      <span className="font-medium">예약 시간 1시간 전까지 취소:</span> 결제 금액의 95% 환불 (5%는 플랫폼 수수료로 공제)
                    </li>
                    <li className="list-disc">
                      <span className="font-medium">예약 시간 1시간 미만 취소:</span> 환불 불가 (결제 금액 전액 매장에 귀속)
                    </li>
                    <li className="list-disc">
                      <span className="font-medium">노쇼(No-show):</span> 환불 불가 (결제 금액 전액 매장에 귀속)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 업체 귀책 사유로 인한 취소</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      업체의 사정으로 서비스 제공이 불가능한 경우: 전액 환불
                    </li>
                    <li className="list-disc">
                      업체가 예약을 일방적으로 취소한 경우: 전액 환불 및 보상 포인트 지급 가능
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">3. 환불 처리 절차</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      환불은 취소 신청 후 영업일 기준 3~5일 이내 처리됩니다.
                    </li>
                    <li className="list-disc">
                      카드 결제의 경우 카드사 정책에 따라 환불 시점이 달라질 수 있습니다.
                    </li>
                    <li className="list-disc">
                      포인트로 결제한 금액은 포인트로 환불됩니다.
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold">유의사항</p>
                  <p className="mt-1">
                    반복적인 예약 취소 또는 노쇼는 신용점수 감점 및 서비스 이용 제한 사유가 될 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제7조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제7조 (신용점수 제도)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 신용점수 개요</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      신용점수는 이용자의 서비스 이용 행태를 점수화하여 건전한 예약 문화를 조성하기 위한 제도입니다.
                    </li>
                    <li className="list-disc">
                      모든 회원은 가입 시 기본 신용점수 <span className="font-semibold text-pink-600">100점</span>을 부여받습니다.
                    </li>
                    <li className="list-disc">
                      신용점수는 이용자의 예약 이행, 취소, 노쇼 등의 행위에 따라 변동됩니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 점수 적립 기준</p>
                  <div className="ml-4 rounded-lg bg-green-50 p-3">
                    <ul className="space-y-1.5">
                      <li className="flex items-center justify-between">
                        <span>예약 방문 완료</span>
                        <span className="font-semibold text-green-600">+2점</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">3. 점수 감점 기준</p>
                  <div className="ml-4 rounded-lg bg-red-50 p-3">
                    <ul className="space-y-1.5">
                      <li className="flex items-center justify-between">
                        <span>예약 시간 1시간 이내 취소</span>
                        <span className="font-semibold text-red-600">-10점</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>노쇼(No-show)</span>
                        <span className="font-semibold text-red-600">-30점</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>매장으로부터 신고 접수</span>
                        <span className="font-semibold text-red-600">-50점</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">4. 서비스 이용 제한</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      신용점수가 <span className="font-semibold text-red-600">0점</span>에 도달하면 즉시 서비스 이용이 제한됩니다.
                    </li>
                    <li className="list-disc">
                      이용 제한된 회원은 회원 탈퇴 후에도 동일 본인인증 정보로 재가입이 불가합니다.
                    </li>
                    <li className="list-disc">
                      이용 제한에 대한 이의신청은 고객센터를 통해 가능하며, 회사의 심사를 거쳐 결정됩니다.
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                  <p>
                    ※ 신용점수는 마이페이지에서 확인할 수 있으며, 점수 변동 시 알림을 통해 안내됩니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제8조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제8조 (본인인증)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 본인인증 의무</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      회원가입 시 다날 PASS 본인인증을 통한 실명 확인이 필수입니다.
                    </li>
                    <li className="list-disc">
                      본인인증 없이는 서비스 이용이 불가하며, 허위 정보로 인증 시 서비스 이용이 즉시 정지됩니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. CI/DI 정보 수집</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      <span className="font-medium">CI(연계정보):</span> 서비스 간 동일인 확인 및 중복가입 방지를 위해 수집합니다.
                    </li>
                    <li className="list-disc">
                      <span className="font-medium">DI(중복가입확인정보):</span> 동일 서비스 내 중복가입 방지를 위해 수집합니다.
                    </li>
                    <li className="list-disc">
                      CI/DI 정보는 암호화되어 안전하게 보관되며, 본인확인 목적 외에는 사용되지 않습니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">3. 재가입 제한</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      신용점수 0점으로 인해 이용이 제한된 회원은 동일 CI/DI로 재가입이 불가합니다.
                    </li>
                    <li className="list-disc">
                      서비스 악용, 사기, 불법 행위 등으로 강제 탈퇴된 회원도 재가입이 불가합니다.
                    </li>
                    <li className="list-disc">
                      재가입 제한 정보는 서비스 보호를 위해 관련 법령에 따라 보관됩니다.
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                  <p className="font-semibold">본인인증 목적</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>- 부정 이용 및 악용 방지</li>
                    <li>- 건전한 예약 문화 조성</li>
                    <li>- 이용자 및 업체 보호</li>
                    <li>- 블랙리스트 관리를 통한 서비스 품질 유지</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제9조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제9조 (포인트 및 쿠폰)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 포인트</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      포인트는 서비스 이용, 이벤트 참여, 출석체크 등을 통해 적립됩니다.
                    </li>
                    <li className="list-disc">
                      적립된 포인트는 결제 시 현금처럼 사용할 수 있습니다.
                    </li>
                    <li className="list-disc">
                      포인트의 유효기간은 적립일로부터 1년이며, 기간 경과 시 자동 소멸됩니다.
                    </li>
                    <li className="list-disc">
                      포인트는 타인에게 양도하거나 현금으로 환전할 수 없습니다.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 쿠폰</p>
                  <ul className="ml-4 space-y-1">
                    <li className="list-disc">
                      쿠폰은 회사의 프로모션, 이벤트 등을 통해 발급됩니다.
                    </li>
                    <li className="list-disc">
                      각 쿠폰에는 사용 조건 및 유효기간이 명시되어 있습니다.
                    </li>
                    <li className="list-disc">
                      쿠폰은 타인에게 양도할 수 없으며, 현금으로 환전할 수 없습니다.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제10조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제10조 (금지 행위)
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다:</p>
                <ul className="ml-4 space-y-1">
                  <li className="list-decimal">
                    회원가입 신청 또는 변경 시 허위내용 등록
                  </li>
                  <li className="list-decimal">
                    타인의 정보 도용 또는 부정 사용
                  </li>
                  <li className="list-decimal">
                    회사의 운영을 고의로 방해하는 행위
                  </li>
                  <li className="list-decimal">
                    음란물, 불법정보, 허위정보 등의 게시 또는 전송
                  </li>
                  <li className="list-decimal">
                    회사 및 제3자의 지적재산권 침해
                  </li>
                  <li className="list-decimal">
                    회사의 승인 없이 영리 목적의 서비스 이용
                  </li>
                  <li className="list-decimal">
                    예약 후 정당한 사유 없이 반복적으로 노쇼(No-show)하는 행위
                  </li>
                  <li className="list-decimal">
                    부정한 방법으로 포인트 또는 쿠폰을 취득하는 행위
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 제11조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제11조 (서비스의 변경 및 중단)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 서비스 변경</p>
                  <p>
                    회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있으며, 변경 사항은 서비스 화면에 공지합니다.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 서비스 중단</p>
                  <p>
                    다음 각 호의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
                  </p>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li className="list-disc">
                      시스템 정기점검, 증설, 교체 등 불가피한 경우
                    </li>
                    <li className="list-disc">
                      천재지변, 국가비상사태 등 불가항력적인 사유가 있는 경우
                    </li>
                    <li className="list-disc">
                      서비스 이용의 폭주 등으로 정상적인 서비스 제공이 어려운 경우
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제12조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제12조 (면책 조항)
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <ul className="ml-4 space-y-1.5">
                  <li className="list-decimal">
                    회사는 천재지변, 전쟁, 테러 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
                  </li>
                  <li className="list-decimal">
                    회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.
                  </li>
                  <li className="list-decimal">
                    회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.
                  </li>
                  <li className="list-decimal">
                    회사는 업체가 제공하는 실제 서비스의 품질, 안전성 등에 대하여 직접적인 책임을 지지 않으며, 이는 업체와 이용자 간의 문제입니다.
                  </li>
                  <li className="list-decimal">
                    회사는 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대하여 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임을 지지 않습니다.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 제13조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제13조 (분쟁 해결)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">1. 준거법</p>
                  <p>
                    본 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국의 법령을 적용합니다.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">2. 관할법원</p>
                  <p>
                    서비스 이용으로 발생한 분쟁에 대하여 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할법원으로 합니다.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-semibold text-slate-700">3. 분쟁조정</p>
                  <p>
                    회사와 이용자는 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 하며, 분쟁 발생 시 한국소비자원 또는 전자거래분쟁조정위원회에 조정을 신청할 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제14조 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                제14조 (개인정보 보호)
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>
                  회사는 이용자의 개인정보를 보호하기 위하여 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하며, 별도의 개인정보처리방침을 정하여 운영합니다.
                </p>
                <p className="mt-2">
                  자세한 내용은 회사의 개인정보처리방침을 참고하시기 바랍니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 부칙 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <ChevronRight className="h-4 w-4 text-pink-500" />
                부칙
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                <p>본 약관은 2025년 1월 26일부터 시행됩니다.</p>
                <p className="mt-3 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                  ※ 본 약관에 대한 문의사항이 있으시면 고객센터(
                  <a
                    href="mailto:support@todaymassage.com"
                    className="font-medium text-pink-600 hover:underline"
                  >
                    support@todaymassage.com
                  </a>
                  )로 연락주시기 바랍니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
