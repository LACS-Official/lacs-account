import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SetupDatabasePage() {
  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">数据库设置</h1>
          <p className="text-center text-muted-foreground">
            在使用邀请码功能之前，请先在 Supabase 中创建必要的数据库表
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>步骤 1: 登录 Supabase Dashboard</CardTitle>
            <CardDescription>
              访问 <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 hover:underline">Supabase Dashboard</a> 并登录您的账户
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>步骤 2: 打开 SQL 编辑器</CardTitle>
            <CardDescription>
              在您的项目中，点击左侧菜单的 &quot;SQL Editor&quot;
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>步骤 3: 执行以下 SQL 语句</CardTitle>
            <CardDescription>
              复制以下 SQL 代码并在 SQL 编辑器中执行
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`-- 创建邀请码表
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
ON CONFLICT (code) DO NOTHING;`}
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>步骤 4: 验证设置</CardTitle>
            <CardDescription>
              执行完成后，您可以使用以下测试邀请码进行注册测试
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-mono bg-gray-100 p-2 rounded">ABC123</div>
              <div className="font-mono bg-gray-100 p-2 rounded">XYZ789</div>
              <div className="font-mono bg-gray-100 p-2 rounded">DEF456</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              设置完成后，您可以访问 <a href="/jhm" className="text-blue-600 hover:underline">/jhm</a> 页面生成新的邀请码
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
