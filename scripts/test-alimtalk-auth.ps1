# =============================================================
# 알림톡 API 인증 테스트 스크립트 (PowerShell)
# =============================================================
# 사용법: .\scripts\test-alimtalk-auth.ps1
#
# 이 스크립트는 다음을 테스트합니다:
# 1. GET 요청 (헬스체크) - 인증 불필요
# 2. POST 요청 (API Key 없음) - 401 오류 예상
# 3. POST 요청 (잘못된 API Key) - 401 오류 예상
# 4. POST 요청 (올바른 API Key) - 성공 또는 카카오 API 오류
# =============================================================

# API 엔드포인트
$API_URL = "http://localhost:3000/api/notifications/alimtalk"

# .env.local에서 API Key 읽기
$API_KEY = $null
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^ALIMTALK_API_SECRET_KEY=(.+)$") {
            $API_KEY = $Matches[1]
        }
    }
}

Write-Host "========================================================"
Write-Host "알림톡 API 인증 테스트"
Write-Host "========================================================"
Write-Host ""

# 테스트 데이터
$testData = @{
    type = "booking_confirmation"
    data = @{
        customerName = "홍길동"
        customerPhone = "01012345678"
        shopName = "편안한 마사지"
        serviceName = "스웨디시 마사지"
        bookingDate = "2024-03-20"
        bookingTime = "14:00"
        bookingId = "BOOK-TEST-001"
    }
} | ConvertTo-Json -Depth 10

# 테스트 1: GET 요청 (헬스체크)
Write-Host "[테스트 1] GET 요청 - 헬스체크 (인증 불필요)" -ForegroundColor Yellow
Write-Host "요청: GET $API_URL"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $API_URL -Method GET -UseBasicParsing
    Write-Host "응답 상태 코드: $($response.StatusCode)"
    Write-Host "응답 본문:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 성공: 헬스체크 정상 작동" -ForegroundColor Green
    } else {
        Write-Host "❌ 실패: 예상치 못한 상태 코드" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 오류: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "--------------------------------------------------------"
Write-Host ""

# 테스트 2: POST 요청 (API Key 없음)
Write-Host "[테스트 2] POST 요청 - API Key 없음 (401 오류 예상)" -ForegroundColor Yellow
Write-Host "요청: POST $API_URL"
Write-Host "헤더: Content-Type: application/json"
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri $API_URL `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing

    Write-Host "응답 상태 코드: $($response.StatusCode)"
    Write-Host "응답 본문:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host "❌ 실패: 인증 없이 요청이 성공함 (401 예상)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "응답 상태 코드: $statusCode"

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답 본문:"
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
        $reader.Close()
    }

    if ($statusCode -eq 401) {
        Write-Host "✅ 성공: 인증 실패 오류 정상 반환" -ForegroundColor Green
    } else {
        Write-Host "❌ 실패: 예상치 못한 상태 코드 (401 예상)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "--------------------------------------------------------"
Write-Host ""

# 테스트 3: POST 요청 (잘못된 API Key)
Write-Host "[테스트 3] POST 요청 - 잘못된 API Key (401 오류 예상)" -ForegroundColor Yellow
Write-Host "요청: POST $API_URL"
Write-Host "헤더: x-api-key: wrong-api-key"
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
        "x-api-key" = "wrong-api-key"
    }

    $response = Invoke-WebRequest `
        -Uri $API_URL `
        -Method POST `
        -Headers $headers `
        -Body $testData `
        -UseBasicParsing

    Write-Host "응답 상태 코드: $($response.StatusCode)"
    Write-Host "응답 본문:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host "❌ 실패: 잘못된 API Key로 요청이 성공함 (401 예상)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "응답 상태 코드: $statusCode"

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답 본문:"
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
        $reader.Close()
    }

    if ($statusCode -eq 401) {
        Write-Host "✅ 성공: 인증 실패 오류 정상 반환" -ForegroundColor Green
    } else {
        Write-Host "❌ 실패: 예상치 못한 상태 코드 (401 예상)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "--------------------------------------------------------"
Write-Host ""

# 테스트 4: POST 요청 (올바른 API Key)
if ([string]::IsNullOrEmpty($API_KEY)) {
    Write-Host "[테스트 4] POST 요청 - 올바른 API Key" -ForegroundColor Yellow
    Write-Host "⚠️ 건너뜀: ALIMTALK_API_SECRET_KEY 환경변수가 설정되지 않았습니다" -ForegroundColor Red
    Write-Host ".env.local 파일에 ALIMTALK_API_SECRET_KEY를 설정해주세요"
} else {
    Write-Host "[테스트 4] POST 요청 - 올바른 API Key" -ForegroundColor Yellow
    Write-Host "요청: POST $API_URL"
    $maskedKey = $API_KEY.Substring(0, [Math]::Min(10, $API_KEY.Length)) + "***"
    Write-Host "헤더: x-api-key: $maskedKey"
    Write-Host ""

    try {
        $headers = @{
            "Content-Type" = "application/json"
            "x-api-key" = $API_KEY
        }

        $response = Invoke-WebRequest `
            -Uri $API_URL `
            -Method POST `
            -Headers $headers `
            -Body $testData `
            -UseBasicParsing

        Write-Host "응답 상태 코드: $($response.StatusCode)"
        Write-Host "응답 본문:"
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 성공: 알림톡 발송 성공" -ForegroundColor Green
        } else {
            Write-Host "❌ 실패: 예상치 못한 상태 코드" -ForegroundColor Red
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "응답 상태 코드: $statusCode"

        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "응답 본문:"
            $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
            $reader.Close()
        }

        if ($statusCode -eq 200) {
            Write-Host "✅ 성공: 알림톡 발송 성공" -ForegroundColor Green
        } elseif ($statusCode -eq 500) {
            Write-Host "⚠️ 부분 성공: 인증은 통과했으나 카카오 API 오류" -ForegroundColor Yellow
            Write-Host "카카오 알림톡 환경변수를 확인해주세요"
        } elseif ($statusCode -eq 401) {
            Write-Host "❌ 실패: API Key가 일치하지 않습니다" -ForegroundColor Red
        } else {
            Write-Host "❌ 실패: 예상치 못한 상태 코드" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================================"
Write-Host "테스트 완료"
Write-Host "========================================================"
