-- 创建邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(6) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_email VARCHAR(255),
  created_by VARCHAR(255),
  CONSTRAINT invite_codes_code_format CHECK (
    code ~ '^[A-Z0-9]{6}$'
  )
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at ON invite_codes(created_at);

-- 添加 RLS (Row Level Security) 策略
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略（避免重复执行时出错）
DROP POLICY IF EXISTS "Allow select for invite code validation" ON invite_codes;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON invite_codes;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON invite_codes;

-- 允许所有人查询邀请码（用于验证）
CREATE POLICY "Allow select for invite code validation" ON invite_codes
  FOR SELECT USING (true);

-- 只允许认证用户创建邀请码
CREATE POLICY "Allow insert for authenticated users" ON invite_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 只允许认证用户更新邀请码状态
CREATE POLICY "Allow update for authenticated users" ON invite_codes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 插入一些示例邀请码用于测试
INSERT INTO invite_codes (code, created_by) VALUES 
  ('ABC123', 'system'),
  ('XYZ789', 'system'),
  ('DEF456', 'system')
ON CONFLICT (code) DO NOTHING;
