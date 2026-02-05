# -*- coding: utf-8 -*-
"""
오늘의마사지 - 동업자용 사업 계획서 PDF 생성
전문적이고 깔끔한 파란색 계열 디자인
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Image
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Rect, Line
from reportlab.graphics import renderPDF
import os

# 색상 정의 (파란색 계열)
PRIMARY_BLUE = HexColor('#1E40AF')      # 진한 파란색
SECONDARY_BLUE = HexColor('#3B82F6')    # 밝은 파란색
LIGHT_BLUE = HexColor('#DBEAFE')        # 연한 파란색
DARK_BLUE = HexColor('#1E3A8A')         # 어두운 파란색
ACCENT_BLUE = HexColor('#60A5FA')       # 강조 파란색
TEXT_DARK = HexColor('#1F2937')         # 어두운 텍스트
TEXT_GRAY = HexColor('#6B7280')         # 회색 텍스트
BG_LIGHT = HexColor('#F8FAFC')          # 밝은 배경
SUCCESS_GREEN = HexColor('#10B981')     # 녹색 (성공)
WARNING_ORANGE = HexColor('#F59E0B')    # 주황색 (주의)

# 한글 폰트 등록 시도
def register_fonts():
    font_paths = [
        # Windows
        'C:/Windows/Fonts/malgun.ttf',
        'C:/Windows/Fonts/NanumGothic.ttf',
        # macOS
        '/System/Library/Fonts/AppleSDGothicNeo.ttc',
        '/Library/Fonts/NanumGothic.ttf',
        # Linux
        '/usr/share/fonts/truetype/nanum/NanumGothic.ttf',
    ]

    for path in font_paths:
        if os.path.exists(path):
            try:
                if 'malgun' in path.lower():
                    pdfmetrics.registerFont(TTFont('Korean', path))
                    pdfmetrics.registerFont(TTFont('KoreanBold', path.replace('.ttf', 'bd.ttf') if os.path.exists(path.replace('.ttf', 'bd.ttf')) else path))
                else:
                    pdfmetrics.registerFont(TTFont('Korean', path))
                    pdfmetrics.registerFont(TTFont('KoreanBold', path))
                return 'Korean'
            except:
                continue
    return 'Helvetica'

FONT_NAME = register_fonts()

# 스타일 정의
def get_styles():
    styles = getSampleStyleSheet()

    # 제목 스타일
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName=FONT_NAME,
        fontSize=36,
        textColor=white,
        alignment=TA_CENTER,
        spaceAfter=20,
        leading=44
    ))

    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName=FONT_NAME,
        fontSize=18,
        textColor=white,
        alignment=TA_CENTER,
        spaceAfter=10,
        leading=24
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName=FONT_NAME,
        fontSize=22,
        textColor=PRIMARY_BLUE,
        alignment=TA_LEFT,
        spaceBefore=20,
        spaceAfter=15,
        leading=28
    ))

    styles.add(ParagraphStyle(
        name='SubsectionTitle',
        fontName=FONT_NAME,
        fontSize=14,
        textColor=DARK_BLUE,
        alignment=TA_LEFT,
        spaceBefore=15,
        spaceAfter=8,
        leading=18
    ))

    # BodyText 스타일 수정 (기존 스타일 업데이트)
    styles['BodyText'].fontName = FONT_NAME
    styles['BodyText'].fontSize = 11
    styles['BodyText'].textColor = TEXT_DARK
    styles['BodyText'].alignment = TA_JUSTIFY
    styles['BodyText'].spaceAfter = 8
    styles['BodyText'].leading = 16

    styles.add(ParagraphStyle(
        name='BulletPoint',
        fontName=FONT_NAME,
        fontSize=11,
        textColor=TEXT_DARK,
        alignment=TA_LEFT,
        leftIndent=15,
        spaceAfter=5,
        leading=15
    ))

    styles.add(ParagraphStyle(
        name='Highlight',
        fontName=FONT_NAME,
        fontSize=12,
        textColor=PRIMARY_BLUE,
        alignment=TA_LEFT,
        spaceAfter=8,
        leading=16
    ))

    styles.add(ParagraphStyle(
        name='Caption',
        fontName=FONT_NAME,
        fontSize=9,
        textColor=TEXT_GRAY,
        alignment=TA_CENTER,
        spaceAfter=10,
        leading=12
    ))

    styles.add(ParagraphStyle(
        name='BoxTitle',
        fontName=FONT_NAME,
        fontSize=13,
        textColor=PRIMARY_BLUE,
        alignment=TA_LEFT,
        spaceBefore=5,
        spaceAfter=8,
        leading=16
    ))

    styles.add(ParagraphStyle(
        name='BoxText',
        fontName=FONT_NAME,
        fontSize=10,
        textColor=TEXT_DARK,
        alignment=TA_LEFT,
        spaceAfter=4,
        leading=14
    ))

    styles.add(ParagraphStyle(
        name='BigNumber',
        fontName=FONT_NAME,
        fontSize=28,
        textColor=PRIMARY_BLUE,
        alignment=TA_CENTER,
        leading=34
    ))

    styles.add(ParagraphStyle(
        name='NumberLabel',
        fontName=FONT_NAME,
        fontSize=10,
        textColor=TEXT_GRAY,
        alignment=TA_CENTER,
        leading=13
    ))

    return styles

def create_cover_page(c, width, height):
    """표지 페이지 생성"""
    # 배경 그라데이션 효과 (단색으로 대체)
    c.setFillColor(PRIMARY_BLUE)
    c.rect(0, 0, width, height, fill=True, stroke=False)

    # 장식 원형들
    c.setFillColor(HexColor('#2563EB'))
    c.circle(width - 50*mm, height - 80*mm, 120*mm, fill=True, stroke=False)
    c.setFillColor(HexColor('#1D4ED8'))
    c.circle(-30*mm, 100*mm, 80*mm, fill=True, stroke=False)

    # 상단 라인
    c.setStrokeColor(white)
    c.setLineWidth(2)
    c.line(40*mm, height - 50*mm, width - 40*mm, height - 50*mm)

    # 메인 타이틀
    c.setFillColor(white)
    c.setFont(FONT_NAME, 42)
    c.drawCentredString(width/2, height - 100*mm, "오늘의마사지")

    c.setFont(FONT_NAME, 18)
    c.drawCentredString(width/2, height - 115*mm, "Today's Massage")

    # 서브타이틀
    c.setFont(FONT_NAME, 24)
    c.drawCentredString(width/2, height - 145*mm, "동업자용 사업 계획서")

    # 구분선
    c.setLineWidth(1)
    c.line(width/2 - 60*mm, height - 160*mm, width/2 + 60*mm, height - 160*mm)

    # 핵심 정보 박스
    box_y = height - 220*mm
    box_height = 45*mm
    c.setFillColor(HexColor('#1D4ED8'))
    c.roundRect(30*mm, box_y, width - 60*mm, box_height, 5*mm, fill=True, stroke=False)

    c.setFillColor(white)
    c.setFont(FONT_NAME, 14)

    info_items = [
        ("시장 규모", "2조원"),
        ("개발 완료", "96%"),
        ("5년 목표", "196억+")
    ]

    item_width = (width - 60*mm) / 3
    for i, (label, value) in enumerate(info_items):
        x = 30*mm + item_width * i + item_width/2
        c.setFont(FONT_NAME, 11)
        c.drawCentredString(x, box_y + 28*mm, label)
        c.setFont(FONT_NAME, 20)
        c.drawCentredString(x, box_y + 12*mm, value)

    # 하단 정보
    c.setFillColor(HexColor('#93C5FD'))
    c.setFont(FONT_NAME, 11)
    c.drawCentredString(width/2, 40*mm, "2026년 1월")
    c.drawCentredString(width/2, 28*mm, "CONFIDENTIAL - 투자 검토용")

    # 하단 라인
    c.line(40*mm, 55*mm, width - 40*mm, 55*mm)

def add_page_header_footer(c, doc, page_num):
    """페이지 헤더/푸터"""
    width, height = A4

    # 헤더 라인
    c.setStrokeColor(LIGHT_BLUE)
    c.setLineWidth(2)
    c.line(20*mm, height - 15*mm, width - 20*mm, height - 15*mm)

    # 헤더 텍스트
    c.setFillColor(PRIMARY_BLUE)
    c.setFont(FONT_NAME, 9)
    c.drawString(20*mm, height - 12*mm, "오늘의마사지 - 사업 계획서")

    # 푸터
    c.setStrokeColor(LIGHT_BLUE)
    c.line(20*mm, 15*mm, width - 20*mm, 15*mm)

    c.setFillColor(TEXT_GRAY)
    c.setFont(FONT_NAME, 9)
    c.drawCentredString(width/2, 8*mm, f"- {page_num} -")
    c.drawRightString(width - 20*mm, 8*mm, "CONFIDENTIAL")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for i, state in enumerate(self._saved_page_states):
            self.__dict__.update(state)
            if i > 0:  # 표지 제외
                add_page_header_footer(self, None, i)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

def create_table(data, col_widths, header=True):
    """표 생성 헬퍼"""
    table = Table(data, colWidths=col_widths)

    style_commands = [
        ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_DARK),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]

    if header:
        style_commands.extend([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
        ])

    # 교차 행 색상
    for i in range(1 if header else 0, len(data)):
        if i % 2 == (1 if header else 0):
            style_commands.append(('BACKGROUND', (0, i), (-1, i), LIGHT_BLUE))
        else:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), white))

    style_commands.extend([
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#E5E7EB')),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY_BLUE),
    ])

    table.setStyle(TableStyle(style_commands))
    return table

def create_highlight_box(content, styles, box_color=LIGHT_BLUE):
    """하이라이트 박스 생성"""
    data = [[Paragraph(content, styles['BoxText'])]]
    table = Table(data, colWidths=[160*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), box_color),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('BOX', (0, 0), (-1, -1), 2, PRIMARY_BLUE),
    ]))
    return table

def create_stat_boxes(items, styles):
    """통계 박스들 생성"""
    cells = []
    for value, label in items:
        cell_content = [
            Paragraph(f'<font size="24" color="{PRIMARY_BLUE.hexval()}">{value}</font>', styles['BigNumber']),
            Paragraph(label, styles['NumberLabel'])
        ]
        cells.append(cell_content)

    # 가로로 배치
    data = [cells]
    col_width = 160*mm / len(items)
    table = Table(data, colWidths=[col_width] * len(items))
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY_BLUE),
        ('LINEBEFORE', (1, 0), (-1, -1), 1, HexColor('#BFDBFE')),
    ]))
    return table

def build_content(styles):
    """문서 내용 생성"""
    story = []

    # ===== 페이지 1: 사업 요약 =====
    story.append(Paragraph("1. 한눈에 보는 사업 요약", styles['SectionTitle']))

    story.append(Paragraph(
        '<b>"배달의민족"의 마사지 버전</b> - 고객과 매장을 연결하는 예약 중개 플랫폼',
        styles['Highlight']
    ))
    story.append(Spacer(1, 5*mm))

    # 핵심 지표
    story.append(create_stat_boxes([
        ("2조원", "시장 규모"),
        ("96%", "개발 완료"),
        ("503억", "5년 누적 순이익"),
    ], styles))
    story.append(Spacer(1, 8*mm))

    # 요약 테이블
    summary_data = [
        ["항목", "내용"],
        ["사업명", "오늘의마사지 (Today's Massage)"],
        ["사업 유형", "마사지/스파 예약 중개 플랫폼"],
        ["시장 규모", "2조원 (국내 마사지/스파 시장)"],
        ["타겟", "전국 2만개 매장 + 무제한 고객"],
        ["현재 상태", "96% 개발 완료 (즉시 출시 가능)"],
        ["5년 목표", "점유율 70%, 연 순이익 196억원+"],
    ]
    story.append(create_table(summary_data, [50*mm, 110*mm]))
    story.append(Spacer(1, 8*mm))

    # 우리가 하는 일
    story.append(Paragraph("우리가 하는 일", styles['SubsectionTitle']))
    for item in ["고객과 매장을 <b>연결</b>해주는 플랫폼",
                 "예약, 결제, 채팅, 리뷰 등 <b>모든 것을 앱으로</b>",
                 "매장은 <b>100% 무료로 입점</b>, 예약 시에만 수수료 지불"]:
        story.append(Paragraph(f"• {item}", styles['BulletPoint']))

    story.append(Spacer(1, 5*mm))
    story.append(create_highlight_box(
        '<b>우리는 "중개"만 합니다. 직접 서비스 제공 X, 직원 고용 X → 리스크 최소화!</b>',
        styles
    ))

    story.append(PageBreak())

    # ===== 페이지 2: 시장 기회 =====
    story.append(Paragraph("2. 왜 이 사업인가? (시장 기회)", styles['SectionTitle']))

    # 시장 현황
    story.append(Paragraph("2.1 시장 현황", styles['SubsectionTitle']))
    market_data = [
        ["지표", "수치"],
        ["국내 마사지/스파 시장", "2조원"],
        ["전국 마사지 매장 수", "약 2만개"],
        ["온라인 예약 비중", "30% 미만 (아직 전화 예약이 대부분)"],
        ["시장 성장률", "연 5-7%"],
    ]
    story.append(create_table(market_data, [70*mm, 90*mm]))
    story.append(Spacer(1, 8*mm))

    # 왜 지금인가
    story.append(Paragraph("2.2 왜 지금인가?", styles['SubsectionTitle']))
    for item in [
        "코로나 이후 <b>비대면 예약</b> 습관화",
        "기존 플랫폼들의 <b>높은 월정액</b>에 매장들 불만",
        "MZ세대의 <b>앱 예약 선호</b>",
        "아직 <b>독점 플랫폼이 없음</b>"
    ]:
        story.append(Paragraph(f"• {item}", styles['BulletPoint']))
    story.append(Spacer(1, 8*mm))

    # 경쟁사 비교
    story.append(Paragraph("2.3 경쟁사 비교", styles['SubsectionTitle']))
    compare_data = [
        ["항목", "마사지통", "힐리/하이타이", "오늘의마사지"],
        ["월정액", "최대 33만원", "10-20만원", "0원 (완전 무료)"],
        ["수수료", "8.8%", "8.8%", "9.9%"],
        ["성별 인증", "없음", "없음", "PASS 본인인증"],
        ["고객 점수", "없음", "없음", "점수 시스템"],
        ["진상 차단", "약함", "약함", "구독시 완전 차단"],
    ]
    story.append(create_table(compare_data, [35*mm, 40*mm, 40*mm, 45*mm]))
    story.append(Spacer(1, 8*mm))

    # 핵심 차별점
    story.append(Paragraph("2.4 우리만의 핵심 차별점", styles['SubsectionTitle']))
    diff_data = [
        ["차별점", "설명"],
        ["1. 100% 무료 입점", "월정액 0원, 입점비 0원 → 경쟁사 대비 연 400만원 절감"],
        ["2. PASS 본인인증", "성별 확인 가능 → 남자만/여자만 받는 샵에 최적화"],
        ["3. 고객 점수 시스템", "노쇼/취소/신고 이력 → 진상인지 사전 판단 가능"],
        ["4. 프리미엄 구독 (향후)", "진상고객에게 매장 비노출, 출입국관리소 위장도 차단"],
    ]
    story.append(create_table(diff_data, [50*mm, 110*mm]))

    story.append(PageBreak())

    # ===== 페이지 3: 수익 모델 =====
    story.append(Paragraph("3. 어떻게 돈을 버나요? (수익 모델)", styles['SectionTitle']))

    story.append(Paragraph("3.1 수익 구조", styles['SubsectionTitle']))

    # 수익 구조 플로우
    flow_data = [
        ["단계", "금액", "설명"],
        ["고객 결제", "60,000원", "예약 및 결제"],
        ["→ PG사 수수료", "- 2,040원 (3.4%)", "결제 대행사"],
        ["→ 플랫폼 수수료", "- 3,900원 (6.5%)", "우리 수익"],
        ["= 매장 정산액", "54,060원", "매장에 지급"],
    ]
    story.append(create_table(flow_data, [40*mm, 45*mm, 75*mm]))
    story.append(Spacer(1, 8*mm))

    # 수익원 종류
    story.append(Paragraph("3.2 수익원 종류", styles['SubsectionTitle']))
    revenue_data = [
        ["수익원", "비중", "설명", "시작 시점"],
        ["예약 수수료", "85%", "핵심 수익 (6.5%)", "출시 즉시"],
        ["취소 수수료", "5%", "1시간 이내 취소 시 5%", "출시 즉시"],
        ["프리미엄 구독", "10%", "월 9.9만원 (진상 차단)", "점유율 확대 후"],
    ]
    story.append(create_table(revenue_data, [35*mm, 25*mm, 55*mm, 45*mm]))
    story.append(Spacer(1, 8*mm))

    # 정산 주기
    story.append(create_highlight_box(
        '<b>정산 주기:</b> 매월 2회 정산 → 매장 현금흐름 원활<br/>'
        '• 1차: 1~15일 예약 → 25일 정산<br/>'
        '• 2차: 16~말일 예약 → 익월 10일 정산',
        styles
    ))

    story.append(PageBreak())

    # ===== 페이지 4: 비용 =====
    story.append(Paragraph("4. 돈이 얼마나 들어가나요? (운영 비용)", styles['SectionTitle']))

    story.append(create_highlight_box(
        '<b>참고:</b> 개발은 이미 96% 완료되어 있습니다. 아래는 <b>출시 후 실제 발생하는 비용</b>만 정리했습니다.',
        styles, HexColor('#FEF3C7')
    ))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("4.1 월간 운영 비용", styles['SubsectionTitle']))
    cost_data = [
        ["항목", "월 비용", "연 비용", "설명"],
        ["서버 (Vercel + Supabase)", "50만원", "600만원", "트래픽 따라 증가"],
        ["외부 서비스", "30만원", "360만원", "Twilio, Firebase, 다날 등"],
        ["인건비 (CS 1명)", "250만원", "3,000만원", "고객/매장 문의 대응"],
        ["사무실/기타", "100만원", "1,200만원", "통신비, 소모품 등"],
        ["합계", "430만원", "5,160만원", ""],
    ]
    story.append(create_table(cost_data, [50*mm, 30*mm, 30*mm, 50*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("4.2 마케팅 비용 (1년차)", styles['SubsectionTitle']))
    marketing_data = [
        ["항목", "월 비용", "연 비용", "설명"],
        ["신규가입 쿠폰", "250만원", "3,000만원", "5천원 × 2장 × 5만명"],
        ["출석체크 포인트", "50만원", "600만원", "앱 재방문 유도"],
        ["친구초대 리워드", "30만원", "360만원", "바이럴 확산"],
        ["온라인 광고", "300만원", "3,600만원", "인스타, 네이버"],
        ["합계", "630만원", "7,560만원", ""],
    ]
    story.append(create_table(marketing_data, [50*mm, 30*mm, 30*mm, 50*mm]))
    story.append(Spacer(1, 8*mm))

    # 1년차 총 비용
    story.append(create_stat_boxes([
        ("5,160만원", "월간 고정비 (연)"),
        ("7,560만원", "마케팅비"),
        ("약 1.4억원", "1년차 총 비용"),
    ], styles))

    story.append(PageBreak())

    # ===== 페이지 5: 수익 전망 =====
    story.append(Paragraph("5. 얼마나 벌 수 있나요? (5개년 수익 전망)", styles['SectionTitle']))

    story.append(Paragraph("5.1 핵심 가정", styles['SubsectionTitle']))
    assumption_data = [
        ["항목", "값"],
        ["평균 객단가", "60,000원"],
        ["고객당 월 이용", "0.8회"],
        ["플랫폼 순수익률", "6.5% (PG 수수료 제외)"],
        ["법인세율", "22%"],
    ]
    story.append(create_table(assumption_data, [60*mm, 100*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("5.2 5개년 수익 시뮬레이션", styles['SubsectionTitle']))
    profit_data = [
        ["연차", "점유율", "매장 수", "고객 수", "연 GMV", "세후순이익"],
        ["1년차", "5%", "1,000개", "5만명", "288억", "13.5억"],
        ["2년차", "20%", "4,000개", "20만명", "1,152억", "56억"],
        ["3년차", "35%", "7,000개", "35만명", "2,016억", "98억"],
        ["4년차", "50%", "10,000개", "50만명", "2,880억", "140억"],
        ["5년차", "70%", "14,000개", "70만명", "4,032억", "196억"],
    ]
    story.append(create_table(profit_data, [23*mm, 23*mm, 28*mm, 28*mm, 30*mm, 28*mm]))
    story.append(Spacer(1, 8*mm))

    # 누적 순이익
    story.append(Paragraph("5.3 누적 순이익", styles['SubsectionTitle']))
    story.append(create_stat_boxes([
        ("69.5억", "2년차 누적"),
        ("167.5억", "3년차 누적"),
        ("503.5억", "5년차 누적"),
    ], styles))
    story.append(Spacer(1, 8*mm))

    # 프리미엄 구독 추가 수익
    story.append(create_highlight_box(
        '<b>프리미엄 구독 추가 수익 (3년차~)</b><br/>'
        '• 3년차: 7,000개 × 20% × 9.9만원 × 12개월 = <b>166억원</b> 추가<br/>'
        '• 5년차: 14,000개 × 30% × 9.9만원 × 12개월 = <b>498억원</b> 추가<br/>'
        '→ 구독 수익까지 합치면 5년차 순이익 <b>300억원+</b> 가능',
        styles
    ))

    story.append(PageBreak())

    # ===== 페이지 6: 매장 혜택 =====
    story.append(Paragraph("6. 매장(사장님)이 왜 가입해야 하나요?", styles['SectionTitle']))

    story.append(Paragraph("6.1 매장 입장에서의 핵심 혜택", styles['SubsectionTitle']))
    benefit_data = [
        ["문제 (현재)", "해결책 (오늘의마사지)"],
        ["마통 최대 월 33만원 부담", "월정액 0원 (완전 무료)"],
        ["노쇼/취소 손해", "100% 선결제"],
        ["진상고객 구분 어려움", "고객 점수 시스템"],
        ["여자 손님 오면 곤란 (남전용)", "PASS로 성별 확인"],
        ["출입국관리소 위장 손님", "프리미엄 구독 시 차단"],
    ]
    story.append(create_table(benefit_data, [80*mm, 80*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("6.2 PASS 본인인증의 위력", styles['SubsectionTitle']))
    pass_data = [
        ["기존 플랫폼", "오늘의마사지"],
        ["전화번호만으로 가입", "PASS 본인인증 필수"],
        ["가짜 번호, 대리 예약 가능", "주민등록상 성별 확인"],
        ["성별 확인 불가", "남자만 받는 샵 → 남자만 노출"],
        ["-", "위장/사칭 원천 차단"],
    ]
    story.append(create_table(pass_data, [80*mm, 80*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("6.3 고객 점수 시스템", styles['SubsectionTitle']))
    score_data = [
        ["행동", "점수 변화"],
        ["기본 점수", "100점"],
        ["방문 완료", "+2점"],
        ["좋은 리뷰", "+3점"],
        ["1시간 이내 취소", "-10점"],
        ["노쇼", "-20점"],
        ["신고 접수", "-50점"],
        ["0점 이하", "영구 블랙리스트 (재가입 불가)"],
    ]
    story.append(create_table(score_data, [80*mm, 80*mm]))
    story.append(Spacer(1, 5*mm))

    story.append(create_highlight_box(
        '매장은 예약 요청 시 <b>고객 점수를 확인</b>하고 <b>승인/거절 결정</b> 가능!',
        styles
    ))

    story.append(PageBreak())

    # ===== 페이지 7: 마케팅 & 리스크 =====
    story.append(Paragraph("7. 고객은 어떻게 모으나요? (마케팅 전략)", styles['SectionTitle']))

    story.append(Paragraph("7.1 신규가입 혜택", styles['SubsectionTitle']))
    story.append(create_highlight_box(
        '<b>신규가입 시 5,000원 쿠폰 2장 지급!</b><br/>'
        '• 쿠폰 1: 5,000원 (7일 한정)<br/>'
        '• 쿠폰 2: 5,000원 (14일 한정)<br/>'
        '→ 첫 방문 유도 + 재방문 유도 → 2번 써보면 습관 형성',
        styles
    ))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("7.2 마케팅 전략", styles['SubsectionTitle']))
    strategy_data = [
        ["전략", "예상 비용", "기대 효과"],
        ["신규가입 쿠폰", "5천원 × 2장", "첫 경험 + 재방문 유도"],
        ["출석체크 포인트", "월 50만원", "앱 재방문 습관화"],
        ["친구초대 리워드", "건당 3천원", "바이럴 확산"],
        ["인스타그램 광고", "월 200만원", "20-30대 타겟"],
        ["네이버 검색광고", "월 100만원", "검색 유입"],
    ]
    story.append(create_table(strategy_data, [50*mm, 50*mm, 60*mm]))
    story.append(Spacer(1, 10*mm))

    story.append(Paragraph("8. 리스크는 없나요?", styles['SectionTitle']))

    story.append(Paragraph("8.1 비즈니스 리스크", styles['SubsectionTitle']))
    risk_data = [
        ["리스크", "가능성", "대응 방안"],
        ["경쟁사 무료화", "낮음", "이미 월정액 모델로 수익 중 (전환 어려움)"],
        ["매장 직거래 시도", "높음", "샵과 고객 모두 전화번호 비공개, 채팅만"],
        ["악성 리뷰/고객", "중간", "신용점수 시스템 + 블랙리스트"],
        ["법적 분쟁", "낮음", "중개 플랫폼 면책 조항 명시"],
    ]
    story.append(create_table(risk_data, [45*mm, 25*mm, 90*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("8.2 우리만의 보호 장치", styles['SubsectionTitle']))
    for item in [
        "PASS 본인인증 → 성별 확인 + 신원 확인",
        "신용점수 시스템 → 진상고객 자동 퇴출",
        "100% 선결제 → 노쇼/미결제 없음",
        "샵과 고객 모두 전화번호 비공개 → 직거래 불가능",
        "DI 기반 블랙리스트 → 재가입 불가",
        "프리미엄 구독 → 진상에게 매장 비노출"
    ]:
        story.append(Paragraph(f"• {item}", styles['BulletPoint']))

    story.append(PageBreak())

    # ===== 페이지 8: 투자 & 로드맵 =====
    story.append(Paragraph("9. 왜 지금 투자해야 하나요?", styles['SectionTitle']))

    story.append(Paragraph("9.1 타이밍", styles['SubsectionTitle']))
    for item in [
        "<b>개발 96% 완료</b> → 추가 개발비 거의 없음",
        "<b>시장 성장 중</b> → 아직 독점자 없음",
        "<b>경쟁사 불만 高</b> → 매장 이탈 수요 존재",
        "<b>즉시 출시 가능</b> → 4주 내 런칭 가능"
    ]:
        story.append(Paragraph(f"• {item}", styles['BulletPoint']))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("9.2 투자 대비 리턴", styles['SubsectionTitle']))
    roi_data = [
        ["항목", "금액"],
        ["1년차 필요 자금", "약 1.4억원"],
        ["1년차 예상 순이익", "13.5억원"],
        ["1년차 ROI", "약 10배"],
        ["5년 누적 순이익", "503.5억원"],
    ]
    story.append(create_table(roi_data, [80*mm, 80*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("9.3 Exit 시나리오", styles['SubsectionTitle']))
    exit_data = [
        ["시나리오", "예상 가치"],
        ["5년 운영 후 매각", "순이익 10배 = 2,000억+"],
        ["IPO (상장)", "PSR 5배 적용 → 시총 2,000억+"],
        ["지속 운영", "연 196억 순이익 창출 (5년차)"],
    ]
    story.append(create_table(exit_data, [70*mm, 90*mm]))
    story.append(Spacer(1, 10*mm))

    story.append(Paragraph("10. 실행 로드맵", styles['SectionTitle']))

    story.append(Paragraph("10.1 출시 전 (4주)", styles['SubsectionTitle']))
    roadmap_data = [
        ["주차", "할 일", "담당"],
        ["1주", "본인인증 연동 완료", "개발팀"],
        ["1주", "법률 검토/약관 수정", "법무"],
        ["2주", "베타 테스트 (10개 매장)", "운영팀"],
        ["3주", "피드백 반영 수정", "개발팀"],
        ["4주", "정식 출시", "전체"],
    ]
    story.append(create_table(roadmap_data, [30*mm, 80*mm, 50*mm]))
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph("10.2 성장 로드맵", styles['SubsectionTitle']))
    growth_data = [
        ["연차", "목표", "주요 활동"],
        ["1년차", "1,000개 매장, 5만 고객", "매장 확보 집중 (무료 입점 홍보)"],
        ["2년차", "4,000개 매장, 20만 고객", "고객 확대 (마케팅 강화)"],
        ["3년차", "7,000개 매장", "프리미엄 구독 출시 (20% 구독)"],
        ["4~5년차", "14,000개 매장, 70만 고객", "시장 점유율 70% → Exit 검토"],
    ]
    story.append(create_table(growth_data, [30*mm, 55*mm, 75*mm]))

    story.append(PageBreak())

    # ===== 페이지 9: 핵심 요약 =====
    story.append(Paragraph("11. 핵심 요약: 왜 이 사업인가?", styles['SectionTitle']))

    story.append(Paragraph("경쟁 우위 5가지", styles['SubsectionTitle']))
    advantage_data = [
        ["#", "차별점", "효과"],
        ["1", "100% 무료 입점", "경쟁사 대비 연 400만원 절감"],
        ["2", "PASS 본인인증", "성별 확인 가능 (업계 유일) → 남자만/여자만 샵 최적화"],
        ["3", "고객 점수 시스템", "진상 여부 사전 판단 (업계 유일)"],
        ["4", "프리미엄 구독 (향후)", "진상고객 완전 차단, 출입국관리소 위장도 차단"],
        ["5", "개발 완료", "96% 완성, 즉시 출시 가능"],
    ]
    story.append(create_table(advantage_data, [15*mm, 50*mm, 95*mm]))
    story.append(Spacer(1, 10*mm))

    story.append(Paragraph("5년 후 우리의 모습", styles['SubsectionTitle']))

    # 비전 박스
    vision_content = '''
    <b>전국 14,000개 매장 입점</b><br/>
    <b>70만 활성 고객</b><br/>
    <b>연 GMV 4,000억원</b><br/>
    <b>연 순이익 196억원+</b><br/>
    <b>마사지 예약 플랫폼 1위</b>
    '''
    vision_data = [[Paragraph(vision_content, styles['BoxText'])]]
    vision_table = Table(vision_data, colWidths=[160*mm])
    vision_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(vision_table)
    story.append(Spacer(1, 15*mm))

    # 마무리 메시지
    story.append(create_highlight_box(
        '<b>수수료가 1.1% 높지만, 매장이 얻는 가치는 훨씬 큽니다!</b><br/><br/>'
        '1.1% 더 내고 연 400만원 아끼면서, 진상까지 거를 수 있다면<br/>'
        '그것은 분명 <b>매장에게 이득</b>입니다.',
        styles
    ))

    story.append(Spacer(1, 10*mm))

    # 문의 정보
    story.append(Paragraph("문의 및 연락처", styles['SubsectionTitle']))
    story.append(Paragraph("• 작성일: 2026년 1월 31일", styles['BodyText']))
    story.append(Paragraph("• 문서 목적: 투자 검토용 (CONFIDENTIAL)", styles['BodyText']))
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph(
        "<i>이 문서는 투자 검토용으로 작성되었으며, 실제 수익은 시장 상황에 따라 달라질 수 있습니다.</i>",
        styles['Caption']
    ))

    return story

def create_pdf():
    """PDF 생성 메인 함수"""
    output_path = "C:/a/docs/오늘의마사지_사업계획서.pdf"

    # 문서 설정
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        topMargin=25*mm,
        bottomMargin=20*mm,
        leftMargin=20*mm,
        rightMargin=20*mm
    )

    styles = get_styles()
    story = build_content(styles)

    # 표지 페이지 직접 생성
    width, height = A4
    c = canvas.Canvas(output_path, pagesize=A4)
    create_cover_page(c, width, height)
    c.showPage()
    c.save()

    # 본문 생성 (표지 뒤에 추가)
    from pypdf import PdfReader, PdfWriter

    # 본문 PDF 생성
    temp_content_path = "C:/a/docs/temp_content.pdf"
    doc_content = SimpleDocTemplate(
        temp_content_path,
        pagesize=A4,
        topMargin=25*mm,
        bottomMargin=20*mm,
        leftMargin=20*mm,
        rightMargin=20*mm
    )
    doc_content.build(story, canvasmaker=NumberedCanvas)

    # PDF 병합
    writer = PdfWriter()

    # 표지 추가
    cover_reader = PdfReader(output_path)
    writer.add_page(cover_reader.pages[0])

    # 본문 추가
    content_reader = PdfReader(temp_content_path)
    for page in content_reader.pages:
        writer.add_page(page)

    # 최종 저장
    with open(output_path, "wb") as f:
        writer.write(f)

    # 임시 파일 삭제
    os.remove(temp_content_path)

    print(f"PDF 생성 완료: {output_path}")
    return output_path

if __name__ == "__main__":
    create_pdf()
