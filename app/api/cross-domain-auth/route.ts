/**
 * 跨域认证API路由
 * 处理来自其他网站的认证请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 环境变量配置
const config = {
  // 允许的域名白名单
  allowedOrigins: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    ['http://localhost:3000', 'https://app.lacs.cc'],
  
  // 会话过期时间（24小时）
  sessionExpiry: 24 * 60 * 60 * 1000,
};

/**
 * 验证请求来源
 */
function validateOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  
  return config.allowedOrigins.includes(origin);
}

/**
 * 设置CORS头
 */
function setCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * 生成认证令牌
 */
function generateAuthToken(user: { id: string; email?: string; user_metadata?: { username?: string } }): string {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || user.email?.split('@')[0],
    timestamp: Date.now(),
    expiresAt: Date.now() + config.sessionExpiry,
  };
  
  // 使用 Base64 编码（实际生产环境应该使用 JWT）
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * 验证认证令牌
 */
function validateAuthToken(token: string): { id: string; email?: string; username?: string; timestamp: number; expiresAt: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // 检查令牌是否过期
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('令牌验证失败:', error);
    return null;
  }
}

/**
 * 构建重定向URL
 */
function buildRedirectUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * 处理OPTIONS请求（CORS预检）
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (!validateOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, origin!);
}

/**
 * 处理POST请求
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (!validateOrigin(origin)) {
    return NextResponse.json(
      { success: false, error: '未授权的域名' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, origin: requestOrigin } = body;
    
    // 再次验证请求来源
    if (!validateOrigin(requestOrigin)) {
      const response = NextResponse.json(
        { success: false, error: '未授权的域名' },
        { status: 403 }
      );
      return setCorsHeaders(response, origin!);
    }

    let result;
    switch (action) {
      case 'login':
        result = await handleLogin(body);
        break;
      case 'logout':
        result = await handleLogout(body);
        break;
      case 'verify':
        result = await handleVerify(body);
        break;
      case 'get_user_info':
        result = await handleGetUserInfo(body);
        break;
      default:
        result = { success: false, error: '无效的操作' };
    }

    const response = NextResponse.json(result);
    return setCorsHeaders(response, origin!);

  } catch (error) {
    console.error('跨域认证处理失败:', error);
    const response = NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
    return setCorsHeaders(response, origin!);
  }
}

/**
 * 处理GET请求（状态检查）
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (!validateOrigin(origin)) {
    return NextResponse.json(
      { success: false, error: '未授权的域名' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      const response = NextResponse.json({
        success: false,
        isLoggedIn: false,
      });
      return setCorsHeaders(response, origin!);
    }

    const payload = validateAuthToken(token);
    
    const response = NextResponse.json({
      success: true,
      isLoggedIn: !!payload,
      user: payload ? {
        id: payload.id,
        username: payload.username,
        email: payload.email,
      } : null,
    });
    
    return setCorsHeaders(response, origin!);

  } catch (error) {
    console.error('状态检查失败:', error);
    const response = NextResponse.json({
      success: false,
      isLoggedIn: false,
    });
    return setCorsHeaders(response, origin!);
  }
}

/**
 * 处理登录请求
 */
async function handleLogin(body: { email: string; password: string; returnUrl?: string }) {
  const { email, password, returnUrl } = body;
  
  try {
    const supabase = await createClient();
    
    // 使用 Supabase 进行认证
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: '邮箱或密码错误'
      };
    }

    // 生成认证令牌
    const authToken = generateAuthToken(data.user);
    
    // 构建返回URL
    const redirectUrl = returnUrl ? buildRedirectUrl(returnUrl, {
      loginSuccess: 'true',
      authToken: authToken,
      userInfo: encodeURIComponent(JSON.stringify({
        id: data.user.id,
        username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
        email: data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      }))
    }) : undefined;

    return {
      success: true,
      redirectUrl: redirectUrl,
      user: {
        id: data.user.id,
        username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
        email: data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      },
      token: authToken,
    };

  } catch (error) {
    console.error('登录处理失败:', error);
    return {
      success: false,
      error: '登录失败，请稍后重试'
    };
  }
}

/**
 * 处理登出请求
 */
async function handleLogout(body: { returnUrl?: string }) {
  const { returnUrl } = body;
  
  try {
    const supabase = await createClient();
    
    // 执行登出
    await supabase.auth.signOut();
    
    const redirectUrl = returnUrl ? buildRedirectUrl(returnUrl, {
      logoutSuccess: 'true'
    }) : undefined;

    return {
      success: true,
      redirectUrl: redirectUrl,
    };

  } catch (error) {
    console.error('登出处理失败:', error);
    return {
      success: false,
      error: '登出失败，请稍后重试'
    };
  }
}

/**
 * 处理令牌验证请求
 */
async function handleVerify(body: { token: string }) {
  const { token } = body;
  
  try {
    const payload = validateAuthToken(token);
    
    if (!payload) {
      return {
        success: false,
        error: '令牌无效或已过期'
      };
    }

    return {
      success: true,
      user: {
        id: payload.id,
        username: payload.username,
        email: payload.email,
      },
      expiresAt: payload.expiresAt,
    };

  } catch (error) {
    console.error('令牌验证失败:', error);
    return {
      success: false,
      error: '验证失败，请稍后重试'
    };
  }
}

/**
 * 处理获取用户信息请求
 */
async function handleGetUserInfo(body: { token: string }) {
  const { token } = body;
  
  try {
    const payload = validateAuthToken(token);
    
    if (!payload) {
      return {
        success: false,
        error: '令牌无效或已过期'
      };
    }

    // 可以从数据库获取更详细的用户信息
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.id)
      .single();

    return {
      success: true,
      user: {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        avatar: user?.avatar_url,
        // 可以添加更多用户信息
      },
    };

  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      error: '获取用户信息失败'
    };
  }
}
