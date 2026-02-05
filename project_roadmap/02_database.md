# Step 2: Supabase DB 및 대용량 트래픽(50k) 대비
1. **DB 스키마 생성 (MCP 사용):**
   - `profiles`: id(uuid), role(text), nickname, phone
   - `shops`: id(uuid), name, lat(float8), lng(float8), address, tel, category, images(text[]), view_count(int)
   - `courses`: id, shop_id(FK), name, price_original, price_discount, duration
   - `reservations`: id, user_id, shop_id, course_id, date, time, status
2. **인덱싱(Indexing):** `shops` 테이블의 `lat`, `lng`, `category` 컬럼에 인덱스 생성 필수 (속도 최적화).
3. **타입 정의:** `src/types/supabase.ts` 생성.
4. **RLS 설정:** 초기 개발을 위해 모든 정책을 Open(`true`).
