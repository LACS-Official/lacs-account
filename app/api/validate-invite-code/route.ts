import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeInviteCode, isValidInviteCodeFormat } from '@/lib/invite-codes';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { 
          isValid: false, 
          message: '请输入邀请码' 
        },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeInviteCode(code);

    // 验证邀请码格式
    if (!isValidInviteCodeFormat(normalizedCode)) {
      return NextResponse.json({
        isValid: false,
        message: '邀请码格式不正确，应为6位字母和数字组合'
      });
    }

    const supabase = await createClient();

    // 查询邀请码
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error || !inviteCode) {
      return NextResponse.json({
        isValid: false,
        message: '邀请码不存在'
      });
    }

    // 检查邀请码是否已被使用
    if (inviteCode.is_used) {
      return NextResponse.json({
        isValid: false,
        message: '邀请码已被使用'
      });
    }

    return NextResponse.json({
      isValid: true,
      message: '邀请码有效',
      code: inviteCode
    });

  } catch (error) {
    console.error('验证邀请码时发生错误:', error);
    return NextResponse.json(
      { 
        isValid: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}

// 标记邀请码为已使用
export async function PUT(request: NextRequest) {
  try {
    const { code, userEmail } = await request.json();

    if (!code || !userEmail) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const normalizedCode = normalizeInviteCode(code);
    const supabase = await createClient();

    // 更新邀请码状态
    const { data, error } = await supabase
      .from('invite_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_by_email: userEmail
      })
      .eq('code', normalizedCode)
      .eq('is_used', false) // 确保只更新未使用的邀请码
      .select()
      .single();

    if (error || !data) {
      console.error('更新邀请码状态失败:', error);
      return NextResponse.json(
        { error: '更新邀请码状态失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '邀请码已标记为已使用'
    });

  } catch (error) {
    console.error('标记邀请码为已使用时发生错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
