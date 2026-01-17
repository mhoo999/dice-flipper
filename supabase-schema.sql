-- 주사위 세트 테이블 생성
-- Supabase SQL Editor에서 실행하거나 Supabase Dashboard의 SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS dice_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dice_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_dice_sets_created_at ON dice_sets(created_at DESC);

-- Row Level Security (RLS) 설정
-- 모든 사용자가 읽기 가능하도록 설정
ALTER TABLE dice_sets ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read dice sets"
  ON dice_sets
  FOR SELECT
  USING (true);

-- 쓰기 정책: 모든 사용자가 생성 가능 (나중에 인증 추가 시 수정 가능)
CREATE POLICY "Anyone can insert dice sets"
  ON dice_sets
  FOR INSERT
  WITH CHECK (true);

-- 업데이트 정책: 모든 사용자가 업데이트 가능 (나중에 인증 추가 시 본인만 수정 가능하도록 변경)
CREATE POLICY "Anyone can update dice sets"
  ON dice_sets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_dice_sets_updated_at
  BEFORE UPDATE ON dice_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
