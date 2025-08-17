import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 测试基本连接
    const { error: connectionError } = await supabase
      .from('invite_codes')
      .select('id, code, created_at, is_used')
      .limit(1);

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: '数据库连接失败',
        details: connectionError.message,
        suggestion: '请确保已在 Supabase 中创建 invite_codes 表',
        code: connectionError.code
      });
    }

    // 测试表结构
    const { data: tableData, error: tableError } = await supabase
      .from('invite_codes')
      .select('*')
      .limit(3);

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: '表查询失败',
        details: tableError.message,
        suggestion: '请检查表结构和 RLS 策略配置'
      });
    }

    // 测试插入权限（需要认证用户）
    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      message: '数据库连接正常',
      timestamp: new Date().toISOString(),
      tableExists: true,
      sampleData: tableData,
      userAuthenticated: !!user,
      userEmail: user?.email || null
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
}
