#!/bin/bash

# =============================================================
# 알림톡 API 인증 테스트 스크립트
# =============================================================
# 사용법: ./scripts/test-alimtalk-auth.sh
#
# 이 스크립트는 다음을 테스트합니다:
# 1. GET 요청 (헬스체크) - 인증 불필요
# 2. POST 요청 (API Key 없음) - 401 오류 예상
# 3. POST 요청 (잘못된 API Key) - 401 오류 예상
# 4. POST 요청 (올바른 API Key) - 성공 또는 카카오 API 오류
# =============================================================

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API 엔드포인트
API_URL="http://localhost:3000/api/notifications/alimtalk"

# .env.local에서 API Key 읽기
if [ -f .env.local ]; then
  export $(grep ALIMTALK_API_SECRET_KEY .env.local | xargs)
fi

echo "========================================================"
echo "알림톡 API 인증 테스트"
echo "========================================================"
echo ""

# 테스트 1: GET 요청 (헬스체크)
echo -e "${YELLOW}[테스트 1] GET 요청 - 헬스체크 (인증 불필요)${NC}"
echo "요청: GET $API_URL"
echo ""
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$API_URL")
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "응답 상태 코드: $http_code"
echo "응답 본문:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✅ 성공: 헬스체크 정상 작동${NC}"
else
  echo -e "${RED}❌ 실패: 예상치 못한 상태 코드${NC}"
fi
echo ""
echo "--------------------------------------------------------"
echo ""

# 테스트 2: POST 요청 (API Key 없음)
echo -e "${YELLOW}[테스트 2] POST 요청 - API Key 없음 (401 오류 예상)${NC}"
echo "요청: POST $API_URL"
echo "헤더: Content-Type: application/json"
echo ""
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking_confirmation",
    "data": {
      "customerName": "홍길동",
      "customerPhone": "01012345678",
      "shopName": "편안한 마사지",
      "serviceName": "스웨디시 마사지",
      "bookingDate": "2024-03-20",
      "bookingTime": "14:00",
      "bookingId": "BOOK-TEST-001"
    }
  }')
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "응답 상태 코드: $http_code"
echo "응답 본문:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✅ 성공: 인증 실패 오류 정상 반환${NC}"
else
  echo -e "${RED}❌ 실패: 예상치 못한 상태 코드 (401 예상)${NC}"
fi
echo ""
echo "--------------------------------------------------------"
echo ""

# 테스트 3: POST 요청 (잘못된 API Key)
echo -e "${YELLOW}[테스트 3] POST 요청 - 잘못된 API Key (401 오류 예상)${NC}"
echo "요청: POST $API_URL"
echo "헤더: x-api-key: wrong-api-key"
echo ""
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-api-key" \
  -d '{
    "type": "booking_confirmation",
    "data": {
      "customerName": "홍길동",
      "customerPhone": "01012345678",
      "shopName": "편안한 마사지",
      "serviceName": "스웨디시 마사지",
      "bookingDate": "2024-03-20",
      "bookingTime": "14:00",
      "bookingId": "BOOK-TEST-002"
    }
  }')
http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "응답 상태 코드: $http_code"
echo "응답 본문:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✅ 성공: 인증 실패 오류 정상 반환${NC}"
else
  echo -e "${RED}❌ 실패: 예상치 못한 상태 코드 (401 예상)${NC}"
fi
echo ""
echo "--------------------------------------------------------"
echo ""

# 테스트 4: POST 요청 (올바른 API Key)
if [ -z "$ALIMTALK_API_SECRET_KEY" ]; then
  echo -e "${YELLOW}[테스트 4] POST 요청 - 올바른 API Key${NC}"
  echo -e "${RED}⚠️ 건너뜀: ALIMTALK_API_SECRET_KEY 환경변수가 설정되지 않았습니다${NC}"
  echo ".env.local 파일에 ALIMTALK_API_SECRET_KEY를 설정해주세요"
else
  echo -e "${YELLOW}[테스트 4] POST 요청 - 올바른 API Key${NC}"
  echo "요청: POST $API_URL"
  echo "헤더: x-api-key: ${ALIMTALK_API_SECRET_KEY:0:10}***"
  echo ""
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ALIMTALK_API_SECRET_KEY" \
    -d '{
      "type": "booking_confirmation",
      "data": {
        "customerName": "홍길동",
        "customerPhone": "01012345678",
        "shopName": "편안한 마사지",
        "serviceName": "스웨디시 마사지",
        "bookingDate": "2024-03-20",
        "bookingTime": "14:00",
        "bookingId": "BOOK-TEST-003"
      }
    }')
  http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS:/d')

  echo "응답 상태 코드: $http_code"
  echo "응답 본문:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ 성공: 알림톡 발송 성공${NC}"
  elif [ "$http_code" = "500" ]; then
    echo -e "${YELLOW}⚠️ 부분 성공: 인증은 통과했으나 카카오 API 오류${NC}"
    echo "카카오 알림톡 환경변수를 확인해주세요"
  elif [ "$http_code" = "401" ]; then
    echo -e "${RED}❌ 실패: API Key가 일치하지 않습니다${NC}"
  else
    echo -e "${RED}❌ 실패: 예상치 못한 상태 코드${NC}"
  fi
fi

echo ""
echo "========================================================"
echo "테스트 완료"
echo "========================================================"
