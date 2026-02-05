import { Metadata } from "next";
import {
  Building2,
  Heart,
  Shield,
  Sparkles,
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageCircle,
  ChevronRight,
  Target,
  Users,
  Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "회사 소개 | 오늘의마사지",
  description:
    "오늘의마사지는 모두가 건강한 일상을 누릴 수 있도록 신뢰할 수 있는 마사지/스파 예약 플랫폼을 제공합니다.",
  keywords: ["회사소개", "오늘의마사지", "마사지예약", "스파예약", "연락처"],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-sm">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 px-4 py-12 text-white">
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-3 text-3xl font-bold">오늘의마사지</h1>
            <p className="text-lg font-medium text-white/90">
              Today&apos;s Massage
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              모두가 건강한 일상을 누릴 수 있도록
              <br />
              신뢰할 수 있는 마사지/스파 예약 플랫폼을 제공합니다
            </p>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="px-4 py-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
                  <Target className="h-5 w-5 text-pink-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  비전 & 미션
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    우리의 비전
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    대한민국 1위 웰니스 케어 플랫폼으로 성장하여, 누구나 쉽고
                    편리하게 건강한 일상을 누릴 수 있는 세상을 만듭니다.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    우리의 미션
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    검증된 마사지/스파 업체와 고객을 연결하여, 안전하고 품질
                    높은 웰니스 경험을 제공합니다. 투명한 정보 공개와 합리적인
                    가격으로 고객의 신뢰를 얻고, 파트너사의 성장을 함께
                    도모합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Core Values */}
        <section className="px-4 pb-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">
            핵심 가치
          </h2>
          <div className="space-y-3">
            {/* Trust */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-base font-bold text-slate-900">
                      신뢰
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      엄격한 업체 검증 시스템과 실제 이용자 리뷰를 통해 투명하고
                      신뢰할 수 있는 정보를 제공합니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Convenience */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-base font-bold text-slate-900">
                      편리함
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      언제 어디서나 간편하게 예약하고, 포인트와 쿠폰으로 합리적인
                      가격에 서비스를 이용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
                    <Award className="h-6 w-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-base font-bold text-slate-900">
                      품질
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      전문성을 갖춘 업체만 선별하여 제공하고, 지속적인 품질
                      관리로 최상의 고객 경험을 보장합니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Introduction */}
        <section className="px-4 pb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  서비스 소개
                </h2>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <p>
                  오늘의마사지는 바쁜 일상 속에서 지친 몸과 마음을 케어할 수
                  있는 최적의 마사지/스파 업체를 찾아드립니다.
                </p>
                <p>
                  위치 기반 검색으로 주변 업체를 손쉽게 찾고, 실시간 예약
                  시스템으로 원하는 시간에 바로 예약할 수 있습니다. 다양한
                  할인 쿠폰과 포인트 적립 혜택으로 더욱 합리적인 가격에
                  프리미엄 서비스를 경험하세요.
                </p>
                <p>
                  출석체크, 룰렛 이벤트, 친구 추천 등 다양한 이벤트를 통해 매일
                  새로운 혜택을 받아보실 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* History */}
        <section className="px-4 pb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">연혁</h2>
              </div>

              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white">
                      1
                    </div>
                    <div className="w-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="mb-1 text-sm font-bold text-pink-600">
                      2025년 1월
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      오늘의마사지 서비스 정식 출시
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      웰니스 케어 플랫폼의 새로운 시작
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-bold text-slate-500">
                      Coming Soon
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      더 나은 서비스로 찾아뵙겠습니다
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section className="px-4 pb-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">
            고객센터 연락처
          </h2>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-5">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-slate-700">
                      고객센터 전화
                    </p>
                    <a
                      href="tel:1234-5678"
                      className="text-base font-bold text-pink-600 hover:text-pink-700 transition-colors"
                    >
                      1234-5678
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                      대표 고객센터 (전국 어디서나)
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-slate-700">
                      이메일
                    </p>
                    <a
                      href="mailto:support@todaymassage.com"
                      className="text-base font-medium text-pink-600 hover:text-pink-700 transition-colors break-all"
                    >
                      support@todaymassage.com
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                      24시간 문의 접수 가능
                    </p>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-slate-700">
                      운영시간
                    </p>
                    <p className="text-sm text-slate-900">
                      평일 09:00 ~ 18:00
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      점심시간 12:00 ~ 13:00 · 주말/공휴일 휴무
                    </p>
                  </div>
                </div>

                {/* KakaoTalk */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200">
                    <MessageCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-slate-700">
                      카카오톡 채널
                    </p>
                    <a
                      href="https://pf.kakao.com/_todaymassage"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
                    >
                      @오늘의마사지
                      <ChevronRight className="h-3.5 w-3.5" />
                    </a>
                    <p className="mt-1 text-xs text-slate-500">
                      카톡으로 빠른 상담 받기
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-100">
                <p className="text-xs leading-relaxed text-blue-800">
                  <strong className="font-semibold">안내:</strong> 운영시간
                  외 문의는 이메일 또는 카카오톡 채널로 남겨주시면 순차적으로
                  답변 드립니다. 평균 응답 시간은 영업일 기준 24시간 이내입니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Business Location */}
        <section className="px-4 pb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-200">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">사업장 위치</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-700">
                    본사
                  </p>
                  <p className="text-sm text-slate-600">
                    서울특별시 강남구 테헤란로 123 오늘빌딩 5층
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-700">
                    찾아오시는 길
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>지하철 2호선 강남역 3번 출구 도보 5분</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>지하철 신분당선 강남역 5번 출구 도보 7분</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5">•</span>
                      <span>버스 146, 360, 740 강남역 하차</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Business Information */}
        <section className="px-4 pb-10">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-base font-bold text-slate-900">
                사업자 정보
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="w-32 flex-shrink-0 font-medium text-slate-500">
                    상호명
                  </span>
                  <span className="flex-1 font-medium text-slate-900">
                    (주)오늘의마사지
                  </span>
                </div>

                <div className="flex gap-3">
                  <span className="w-32 flex-shrink-0 font-medium text-slate-500">
                    대표자
                  </span>
                  <span className="flex-1 text-slate-900">홍길동</span>
                </div>

                <div className="flex gap-3">
                  <span className="w-32 flex-shrink-0 font-medium text-slate-500">
                    사업자등록번호
                  </span>
                  <span className="flex-1 font-mono text-slate-900">
                    123-45-67890
                  </span>
                </div>

                <div className="flex gap-3">
                  <span className="w-32 flex-shrink-0 font-medium text-slate-500">
                    통신판매업신고
                  </span>
                  <span className="flex-1 font-mono text-slate-900">
                    2025-서울강남-12345
                  </span>
                </div>

                <div className="flex gap-3">
                  <span className="w-32 flex-shrink-0 font-medium text-slate-500">
                    개인정보책임자
                  </span>
                  <span className="flex-1 text-slate-900">김철수</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-slate-50 p-4">
                <p className="text-xs leading-relaxed text-slate-600">
                  (주)오늘의마사지는 통신판매중개자로서 통신판매의 당사자가
                  아니며, 개별 판매자가 제공하는 서비스에 대한 이행, 계약사항
                  등과 관련한 의무와 책임은 거래당사자에게 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer Note */}
        <section className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 px-4 py-8 text-center text-white">
          <p className="text-sm font-medium">
            오늘의마사지와 함께
            <br />
            건강하고 행복한 일상을 만들어가세요
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-medium">
              고객 여러분의 건강한 삶을 응원합니다
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
