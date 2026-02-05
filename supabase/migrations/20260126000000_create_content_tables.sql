-- Content Management Tables Migration
-- Created: 2026-01-26
-- Description: Tables for notices, FAQs, and banners

-- ==========================================
-- Notices Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'event', 'maintenance', 'policy')),
  is_pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- FAQs Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'reservation', 'payment', 'account', 'partner')),
  "order" integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- Banners Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  position text NOT NULL CHECK (position IN ('main', 'search', 'detail')),
  is_active boolean NOT NULL DEFAULT true,
  start_date date NOT NULL,
  end_date date NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- Indexes
-- ==========================================

-- Notices indexes
CREATE INDEX IF NOT EXISTS idx_notices_category ON public.notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_is_published ON public.notices(is_published);
CREATE INDEX IF NOT EXISTS idx_notices_is_pinned ON public.notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON public.notices(published_at);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON public.notices(created_at DESC);

-- FAQs indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_is_published ON public.faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs("order");

-- Banners indexes
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_order ON public.banners("order");

-- ==========================================
-- Updated_at Triggers
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS Policies
-- ==========================================

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Notices policies
CREATE POLICY "Public can view published notices" ON public.notices
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can do everything with notices" ON public.notices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- FAQs policies
CREATE POLICY "Public can view published FAQs" ON public.faqs
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can do everything with FAQs" ON public.faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Banners policies
CREATE POLICY "Public can view active banners" ON public.banners
  FOR SELECT USING (
    is_active = true
    AND current_date BETWEEN start_date AND end_date
  );

CREATE POLICY "Admins can do everything with banners" ON public.banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to increment notice view count
CREATE OR REPLACE FUNCTION increment_notice_views(notice_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notices
  SET view_count = view_count + 1
  WHERE id = notice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment banner click count
CREATE OR REPLACE FUNCTION increment_banner_clicks(banner_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.banners
  SET click_count = click_count + 1
  WHERE id = banner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Sample Data (Optional - for testing)
-- ==========================================

-- Insert sample notice
INSERT INTO public.notices (title, content, category, is_pinned, is_published, published_at, view_count)
VALUES (
  '서비스 오픈 안내',
  '저희 서비스를 이용해 주셔서 감사합니다. 앞으로도 더 나은 서비스를 제공하기 위해 노력하겠습니다.',
  'general',
  true,
  true,
  now(),
  0
) ON CONFLICT DO NOTHING;

-- Insert sample FAQ
INSERT INTO public.faqs (question, answer, category, "order", is_published)
VALUES (
  '서비스 이용 방법이 궁금합니다.',
  '홈페이지 상단의 메뉴를 통해 원하시는 서비스를 선택하실 수 있습니다.',
  'general',
  1,
  true
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.notices IS '공지사항 테이블';
COMMENT ON TABLE public.faqs IS 'FAQ 테이블';
COMMENT ON TABLE public.banners IS '배너 테이블';
