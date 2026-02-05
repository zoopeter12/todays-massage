'use client';

import { useState } from 'react';
import { ChevronLeft, Search, HelpCircle, CreditCard, Coins, User, MessageCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'reservation' | 'payment' | 'point' | 'account' | 'service';
}

const faqData: FAQItem[] = [
  // 예약 관련
  {
    id: 'res-1',
    category: 'reservation',
    question: '예약은 어떻게 하나요?',
    answer: '홈 화면에서 원하는 가게를 선택한 후, "예약하기" 버튼을 클릭합니다. 날짜, 시간, 서비스를 선택하고 예약을 완료하세요. 예약 확정 후 카카오톡 알림톡으로 예약 정보가 발송됩니다.',
  },
  {
    id: 'res-2',
    category: 'reservation',
    question: '예약을 변경하거나 취소할 수 있나요?',
    answer: '마이페이지 > 내 예약에서 예약 상세 페이지로 이동하여 변경 또는 취소가 가능합니다. 단, 예약 시간 2시간 전까지만 변경/취소가 가능하며, 그 이후에는 고객센터로 문의해주세요.',
  },
  {
    id: 'res-3',
    category: 'reservation',
    question: '노쇼(No-Show) 정책이 무엇인가요?',
    answer: '예약 시간에 나타나지 않거나 사전 취소 없이 방문하지 않을 경우 노쇼로 처리됩니다. 노쇼 발생 시 향후 3개월간 예약이 제한될 수 있으며, 가게에 따라 위약금이 청구될 수 있습니다.',
  },
  {
    id: 'res-4',
    category: 'reservation',
    question: '예약 확인은 어디서 하나요?',
    answer: '마이페이지 > 내 예약에서 확인하실 수 있습니다. 예약 확정 시 카카오톡 알림톡과 앱 푸시 알림으로도 안내됩니다.',
  },
  {
    id: 'res-5',
    category: 'reservation',
    question: '단체 예약도 가능한가요?',
    answer: '3인 이상의 단체 예약은 가게별로 가능 여부가 다릅니다. 가게 상세 페이지에서 단체 예약 가능 여부를 확인하시거나, 채팅 문의를 통해 가게에 직접 문의해주세요.',
  },

  // 결제 관련
  {
    id: 'pay-1',
    category: 'payment',
    question: '어떤 결제 수단을 사용할 수 있나요?',
    answer: '신용카드(국내 전 카드사), 체크카드, 네이버페이, 카카오페이, 토스페이를 지원합니다. 일부 가게는 현장 결제만 가능할 수 있으니 예약 시 확인해주세요.',
  },
  {
    id: 'pay-2',
    category: 'payment',
    question: '환불 정책은 어떻게 되나요?',
    answer: '예약 시간 2시간 전 취소 시 100% 환불됩니다. 2시간 이내 취소 시 30% 위약금이 발생하며, 노쇼의 경우 환불이 불가합니다. 환불은 영업일 기준 3-5일 소요됩니다.',
  },
  {
    id: 'pay-3',
    category: 'payment',
    question: '영수증은 어디서 받을 수 있나요?',
    answer: '마이페이지 > 내 예약 > 예약 상세에서 "영수증 보기" 버튼을 클릭하면 전자 영수증을 확인하고 다운로드할 수 있습니다. 현금영수증 발급도 가능합니다.',
  },
  {
    id: 'pay-4',
    category: 'payment',
    question: '결제 실패 시 어떻게 하나요?',
    answer: '결제 실패 시 카드 한도, 유효기간, 보안 설정을 확인해주세요. 문제가 지속되면 다른 결제 수단을 시도하거나 고객센터(1234-5678)로 문의해주세요.',
  },
  {
    id: 'pay-5',
    category: 'payment',
    question: '할부 결제가 가능한가요?',
    answer: '5만원 이상 결제 시 2-12개월 할부가 가능합니다. 무이자 할부는 카드사별 프로모션에 따라 다르며, 결제 페이지에서 확인하실 수 있습니다.',
  },

  // 포인트/쿠폰 관련
  {
    id: 'point-1',
    category: 'point',
    question: '포인트는 어떻게 적립되나요?',
    answer: '결제 금액의 1%가 자동으로 적립됩니다. 출석체크, 리뷰 작성, 친구 초대 등의 이벤트를 통해서도 추가 적립이 가능합니다. 적립된 포인트는 다음 예약 시 사용할 수 있습니다.',
  },
  {
    id: 'point-2',
    category: 'point',
    question: '포인트는 어떻게 사용하나요?',
    answer: '예약 결제 시 최대 결제 금액의 30%까지 포인트로 사용할 수 있습니다. 1,000포인트부터 사용 가능하며, 100포인트 단위로 사용됩니다.',
  },
  {
    id: 'point-3',
    category: 'point',
    question: '포인트 유효기간이 있나요?',
    answer: '포인트는 적립일로부터 1년간 유효합니다. 유효기간이 임박한 포인트는 마이페이지에서 확인할 수 있으며, 만료 30일 전 알림톡으로 안내됩니다.',
  },
  {
    id: 'point-4',
    category: 'point',
    question: '쿠폰은 어디서 받을 수 있나요?',
    answer: '신규 가입 시 웰컴 쿠폰이 자동 발급되며, 홈 화면의 쿠폰함에서 다운로드할 수 있습니다. 앱 푸시 알림과 이벤트 페이지에서도 쿠폰을 받을 수 있습니다.',
  },
  {
    id: 'point-5',
    category: 'point',
    question: '쿠폰과 포인트를 함께 사용할 수 있나요?',
    answer: '네, 쿠폰 할인 적용 후 남은 금액에 대해 포인트를 추가로 사용할 수 있습니다. 단, 일부 쿠폰은 포인트와 중복 사용이 제한될 수 있습니다.',
  },

  // 계정 관련
  {
    id: 'acc-1',
    category: 'account',
    question: '회원가입은 어떻게 하나요?',
    answer: '카카오톡, 네이버, 구글 계정으로 간편 가입하거나 이메일로 가입할 수 있습니다. 가입 시 휴대폰 번호 인증이 필요하며, 가입 즉시 웰컴 쿠폰이 발급됩니다.',
  },
  {
    id: 'acc-2',
    category: 'account',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer: '마이페이지 > 설정 > 회원 탈퇴에서 진행할 수 있습니다. 탈퇴 시 보유 포인트와 쿠폰이 모두 소멸되며, 예약 내역은 복구되지 않습니다. 진행 중인 예약이 있을 경우 탈퇴가 제한됩니다.',
  },
  {
    id: 'acc-3',
    category: 'account',
    question: '비밀번호를 잊어버렸어요',
    answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하면 가입 시 등록한 이메일로 재설정 링크가 발송됩니다. 이메일을 받지 못한 경우 스팸함을 확인하거나 고객센터로 문의해주세요.',
  },
  {
    id: 'acc-4',
    category: 'account',
    question: '개인정보를 변경하고 싶어요',
    answer: '마이페이지에서 닉네임, 전화번호를 변경할 수 있습니다. 프로필 수정 버튼을 클릭하여 정보를 수정하고 저장하세요. 이메일 변경은 고객센터로 문의해주세요.',
  },
  {
    id: 'acc-5',
    category: 'account',
    question: '여러 기기에서 동시에 사용할 수 있나요?',
    answer: '하나의 계정으로 여러 기기에서 로그인할 수 있습니다. 단, 동시 접속 시 예약 정보가 충돌할 수 있으니 주의해주세요.',
  },

  // 서비스 이용
  {
    id: 'svc-1',
    category: 'service',
    question: '리뷰는 어떻게 작성하나요?',
    answer: '방문 완료 후 마이페이지 > 내 예약에서 "리뷰 작성" 버튼이 활성화됩니다. 리뷰 작성 시 200포인트가 적립되며, 사진 첨부 시 500포인트가 추가로 적립됩니다.',
  },
  {
    id: 'svc-2',
    category: 'service',
    question: '찜하기 기능은 무엇인가요?',
    answer: '마음에 드는 가게를 찜하면 마이페이지 > 찜한 가게에서 쉽게 찾을 수 있습니다. 찜한 가게의 새로운 이벤트나 쿠폰 발행 시 알림을 받을 수 있습니다.',
  },
  {
    id: 'svc-3',
    category: 'service',
    question: '가게에 직접 문의하고 싶어요',
    answer: '가게 상세 페이지에서 "채팅 문의" 버튼을 클릭하면 가게와 1:1 채팅을 시작할 수 있습니다. 채팅 내역은 마이페이지 > 채팅에서 확인할 수 있습니다.',
  },
  {
    id: 'svc-4',
    category: 'service',
    question: '주변 가게는 어떻게 찾나요?',
    answer: '홈 화면 하단의 "내 주변" 탭을 클릭하면 현재 위치 기반으로 가까운 가게를 찾을 수 있습니다. 위치 서비스를 허용해야 이용 가능합니다.',
  },
  {
    id: 'svc-5',
    category: 'service',
    question: '고객센터 운영시간이 어떻게 되나요?',
    answer: '고객센터는 평일 09:00-18:00에 운영됩니다. 전화(1234-5678), 이메일(support@todays-massage.com), 채팅으로 문의 가능하며, 채팅 문의는 24시간 접수됩니다.',
  },
];

const categoryConfig = {
  reservation: { label: '예약', icon: HelpCircle, color: 'text-blue-500' },
  payment: { label: '결제', icon: CreditCard, color: 'text-green-500' },
  point: { label: '포인트/쿠폰', icon: Coins, color: 'text-amber-500' },
  account: { label: '계정', icon: User, color: 'text-purple-500' },
  service: { label: '서비스', icon: MessageCircle, color: 'text-pink-500' },
} as const;

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const faqsByCategory = activeCategory === 'all'
    ? Object.entries(categoryConfig).map(([key, config]) => ({
        category: key,
        config,
        faqs: filteredFAQs.filter((faq) => faq.category === key),
      }))
    : [
        {
          category: activeCategory,
          config: categoryConfig[activeCategory as keyof typeof categoryConfig],
          faqs: filteredFAQs,
        },
      ];

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">자주 묻는 질문</h1>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="궁금한 내용을 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              전체
            </TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="text-xs sm:text-sm flex items-center gap-1">
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="sm:hidden">{config.label.split('/')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6 space-y-6">
            {filteredFAQs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    검색 결과가 없습니다
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    다른 검색어로 시도해보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              faqsByCategory.map(({ category, config, faqs }) => {
                if (faqs.length === 0) return null;
                const Icon = config.icon;

                return (
                  <div key={category}>
                    {activeCategory === 'all' && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <h2 className="text-lg font-bold">{config.label}</h2>
                        <span className="text-sm text-muted-foreground">({faqs.length})</span>
                      </div>
                    )}
                    <Card>
                      <CardContent className="p-4">
                        <Accordion type="single" collapsible className="w-full">
                          {faqs.map((faq, index) => (
                            <AccordionItem key={faq.id} value={faq.id} className={index === faqs.length - 1 ? 'border-0' : ''}>
                              <AccordionTrigger className="text-left hover:no-underline py-4">
                                <div className="flex items-start gap-2 pr-4">
                                  <span className="font-bold text-primary shrink-0">Q.</span>
                                  <span className="font-medium">{faq.question}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                <div className="flex gap-2 pt-2">
                                  <span className="font-bold text-blue-500 shrink-0">A.</span>
                                  <p className="leading-relaxed whitespace-pre-line">{faq.answer}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </Tabs>

        {/* Contact Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-full">
                <MessageCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">찾으시는 답변이 없나요?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  고객센터로 문의해주시면 친절하게 안내해드리겠습니다
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">전화:</span>
                    <a href="tel:1234-5678" className="text-blue-600 hover:underline">
                      1234-5678
                    </a>
                    <span className="text-muted-foreground text-xs">(평일 09:00-18:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">이메일:</span>
                    <a href="mailto:support@todays-massage.com" className="text-blue-600 hover:underline">
                      support@todays-massage.com
                    </a>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/chat">
                    <Button className="w-full sm:w-auto">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      1:1 채팅 문의
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
