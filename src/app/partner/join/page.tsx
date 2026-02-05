'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Calendar,
  MessageCircle,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  BarChart3,
  Shield,
  Zap,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function PartnerJoinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              variants={fadeInUp}
              className="mb-6 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
            >
              파트너 모집 중
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              오늘의마사지와 함께
              <br />
              <span className="bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">
                성장하세요
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mb-8 text-lg text-primary-100 sm:text-xl md:text-2xl"
            >
              신규 고객 유입부터 예약 관리, 정산까지
              <br className="hidden sm:block" />
              스마트한 샵 운영의 시작
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="bg-accent-500 text-white hover:bg-accent-600"
                asChild
              >
                <Link href="#apply">
                  지금 신청하기 <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                asChild
              >
                <Link href="#benefits">더 알아보기</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerChildren}
          className="mx-auto max-w-6xl"
        >
          <motion.div variants={fadeInUp} className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              파트너 혜택
            </h2>
            <p className="text-lg text-gray-600">
              오늘의마사지가 제공하는 차별화된 서비스
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: '신규 고객 유입',
                description:
                  '플랫폼을 통한 지속적인 신규 고객 연결로 매출 증대',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
              },
              {
                icon: Calendar,
                title: '편리한 예약 관리',
                description:
                  '실시간 예약 현황 확인 및 자동 알림으로 노쇼 방지',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
              },
              {
                icon: MessageCircle,
                title: '실시간 채팅 상담',
                description:
                  '고객과의 직접 소통으로 맞춤 서비스 제공 및 재방문율 향상',
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
              },
              {
                icon: CreditCard,
                title: '정산 투명성',
                description:
                  '매출 현황 실시간 확인 및 정기 정산으로 재무 관리 간편화',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
              },
              {
                icon: TrendingUp,
                title: '마케팅 지원',
                description:
                  '프로모션, 쿠폰 시스템 제공 및 플랫폼 마케팅 참여',
                color: 'text-pink-600',
                bgColor: 'bg-pink-50',
              },
              {
                icon: BarChart3,
                title: '데이터 분석',
                description:
                  '예약 통계 및 고객 분석으로 데이터 기반 운영 전략 수립',
                color: 'text-indigo-600',
                bgColor: 'bg-indigo-50',
              },
            ].map((benefit, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border-2 transition-all hover:border-primary-200 hover:shadow-lg">
                  <CardHeader>
                    <div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${benefit.bgColor}`}
                    >
                      <benefit.icon className={`h-7 w-7 ${benefit.color}`} />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    <CardDescription className="text-base">
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Commission Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerChildren}
            className="mx-auto max-w-4xl"
          >
            <motion.div variants={fadeInUp} className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                수수료 안내
              </h2>
              <p className="text-lg text-gray-600">
                합리적이고 투명한 수수료 구조
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              <motion.div variants={fadeInUp}>
                <Card className="h-full border-2 border-primary-200 bg-white">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                      <Building2 className="h-6 w-6 text-primary-600" />
                    </div>
                    <CardTitle className="text-2xl">플랫폼 수수료</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-primary-600">
                        15%
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        예약 건당 발생하는 기본 수수료
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                        <span>고객 유입 및 마케팅 비용 포함</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                        <span>플랫폼 유지보수 및 개선</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                        <span>고객 서비스 및 분쟁 조정 지원</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="h-full border-2 border-gray-200 bg-white">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="text-2xl">결제 수수료</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-gray-900">
                        3.3%
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        PG사 결제 처리 수수료
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                        <span>신용카드, 간편결제 등 모든 결제 수단</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                        <span>PG사 직접 정산 (투명한 수수료)</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                        <span>VAT 별도</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              variants={fadeInUp}
              className="mt-8 rounded-lg border-2 border-accent-200 bg-accent-50 p-6"
            >
              <div className="flex items-start">
                <Zap className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-accent-600" />
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    예상 수령액 계산 예시
                  </h3>
                  <p className="text-sm text-gray-700">
                    예약 금액 100,000원 기준: 100,000원 - 플랫폼 수수료
                    15,000원 - 결제 수수료 3,300원 ={' '}
                    <span className="font-bold text-primary-600">
                      81,700원 수령
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerChildren}
          className="mx-auto max-w-4xl"
        >
          <motion.div variants={fadeInUp} className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              가입 절차
            </h2>
            <p className="text-lg text-gray-600">
              간편하고 빠른 4단계 프로세스
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 md:block" />

            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: '가입 신청',
                  description:
                    '온라인 신청서 작성 및 사업자등록증, 매장 사진 등 필수 서류 제출',
                  icon: CheckCircle2,
                  color: 'bg-blue-500',
                },
                {
                  step: 2,
                  title: '서류 심사',
                  description:
                    '제출된 서류 검토 및 운영 기준 적합성 평가 (영업일 기준 2-3일 소요)',
                  icon: Shield,
                  color: 'bg-green-500',
                },
                {
                  step: 3,
                  title: '승인 및 등록',
                  description:
                    '심사 완료 후 파트너 계정 활성화 및 매장 정보 등록 안내',
                  icon: CheckCircle2,
                  color: 'bg-purple-500',
                },
                {
                  step: 4,
                  title: '운영 시작',
                  description:
                    '플랫폼 오픈 후 즉시 예약 접수 가능 및 전담 매니저 배정',
                  icon: Zap,
                  color: 'bg-amber-500',
                },
              ].map((process, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="relative"
                >
                  <Card className="ml-0 border-2 transition-all hover:border-primary-200 hover:shadow-lg md:ml-20">
                    <CardHeader>
                      <div className="flex items-start">
                        <div
                          className={`absolute -left-4 flex h-16 w-16 items-center justify-center rounded-full ${process.color} text-white shadow-lg md:left-[-5rem]`}
                        >
                          <process.icon className="h-8 w-8" />
                        </div>
                        <div className="ml-16 md:ml-0">
                          <div className="mb-2 text-sm font-semibold text-primary-600">
                            STEP {process.step}
                          </div>
                          <CardTitle className="mb-2 text-2xl">
                            {process.title}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {process.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerChildren}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeInUp} className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                파트너 후기
              </h2>
              <p className="text-lg text-gray-600">
                함께 성장한 파트너들의 생생한 이야기
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  name: '강남 힐링 스파',
                  role: '대표',
                  content:
                    '플랫폼 입점 후 신규 고객이 30% 증가했습니다. 예약 관리도 편하고 무엇보다 정산이 투명해서 만족스럽습니다.',
                  rating: 5,
                },
                {
                  name: '서초 아로마 테라피',
                  role: '원장',
                  content:
                    '채팅 상담 기능 덕분에 고객과 소통이 원활해졌어요. 재방문율이 눈에 띄게 높아졌습니다.',
                  rating: 5,
                },
                {
                  name: '역삼 프리미엄 마사지',
                  role: '사장님',
                  content:
                    '마케팅 지원과 쿠폰 시스템이 특히 좋아요. 고객 관리가 훨씬 수월해졌습니다.',
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full border-2 bg-white transition-all hover:border-primary-200 hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-4 flex items-center text-accent-500">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <svg
                            key={i}
                            className="h-5 w-5 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <CardDescription className="mb-4 text-base italic text-gray-700">
                        &quot;{testimonial.content}&quot;
                      </CardDescription>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {testimonial.role}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="apply" className="container mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          className="mx-auto max-w-3xl"
        >
          <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="mb-4 text-3xl sm:text-4xl">
                지금 바로 시작하세요
              </CardTitle>
              <CardDescription className="text-lg">
                오늘의마사지와 함께 성장할 준비가 되셨나요?
                <br />
                간단한 신청으로 새로운 기회를 만나보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-primary-600 text-lg hover:bg-primary-700"
                  asChild
                >
                  <Link href="/partner/register">
                    파트너 가입 신청하기 <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-gray-600">
                  신청 후 평균 2-3일 내 승인 완료
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="border-t bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerChildren}
            className="mx-auto max-w-4xl"
          >
            <motion.div variants={fadeInUp} className="mb-12 text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                문의하기
              </h2>
              <p className="text-gray-600">
                궁금하신 점이 있으신가요? 언제든지 연락주세요.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              <motion.div variants={fadeInUp}>
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                      <Phone className="h-7 w-7 text-primary-600" />
                    </div>
                    <CardTitle className="text-lg">전화 문의</CardTitle>
                    <CardDescription className="text-base">
                      <a
                        href="tel:1588-0000"
                        className="hover:text-primary-600"
                      >
                        1588-0000
                      </a>
                    </CardDescription>
                    <CardDescription className="text-sm">
                      평일 09:00 - 18:00
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                      <Mail className="h-7 w-7 text-primary-600" />
                    </div>
                    <CardTitle className="text-lg">이메일 문의</CardTitle>
                    <CardDescription className="text-base">
                      <a
                        href="mailto:partner@todaysmassage.com"
                        className="hover:text-primary-600"
                      >
                        partner@todaysmassage.com
                      </a>
                    </CardDescription>
                    <CardDescription className="text-sm">
                      24시간 접수 가능
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                      <Clock className="h-7 w-7 text-primary-600" />
                    </div>
                    <CardTitle className="text-lg">운영 시간</CardTitle>
                    <CardDescription className="text-base">
                      평일 09:00 - 18:00
                    </CardDescription>
                    <CardDescription className="text-sm">
                      주말 및 공휴일 휴무
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
