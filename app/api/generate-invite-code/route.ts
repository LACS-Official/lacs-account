import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInviteCode } from '@/lib/invite-codes';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // 检查用户是否已认证
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '需要登录才能生成邀请码' },
        { status: 401 }
      );
    }

    // 生成唯一的邀请码
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateInviteCode();
      attempts++;
      
      // 检查邀请码是否已存在
      const { data: existingCode } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('code', code)
        .single();
      
      if (!existingCode) {
        break; // 找到唯一的邀请码
      }
      
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: '生成邀请码失败，请重试' },
          { status: 500 }
        );
      }
    } while (true);

    // 插入新的邀请码
    const { data: newInviteCode, error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        code,
        created_by: user.email
      })
      .select()
      .single();

    if (insertError) {
      console.error('插入邀请码失败:', insertError);
      return NextResponse.json(
        { error: '创建邀请码失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: newInviteCode.code,
      message: '邀请码生成成功'
    });

  } catch (error) {
    console.error('生成邀请码时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 检查用户是否已认证
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '需要登录才能查看邀请码' },
        { status: 401 }
      );
    }

    // 获取用户创建的邀请码列表
    const { data: inviteCodes, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('created_by', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取邀请码列表失败:', error);
      return NextResponse.json(
        { error: '获取邀请码列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inviteCodes
    });

  } catch (error) {
    console.error('获取邀请码列表时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
