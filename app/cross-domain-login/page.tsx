"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

interface LoginParams {
  returnUrl: string;
  origin: string;
  timestamp: string;
  crossDomain: string;
}

// 从环境变量读取允许的域名配置
const getAllowedOrigins = (): string[] => {
  const origins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;
  if (origins) {
    return origins.split(',').map(origin => origin.trim());
  }
  // 默认值作为后备
  return ['http://localhost:3000', 'https://app.lacs.cc'];
};

export default function CrossDomainLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginParams, setLoginParams] = useState<LoginParams | null>(null);
  const [isValidRequest, setIsValidRequest] = useState(false);
  const [allowedOrigins] = useState<string[]>(getAllowedOrigins());

  useEffect(() => {
    // 解析URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    const origin = urlParams.get('origin');
    const timestamp = urlParams.get('timestamp');
    const crossDomain = urlParams.get('crossDomain');

    if (returnUrl && origin && crossDomain === 'true') {
      // 验证请求来源
      if (allowedOrigins.includes(origin)) {
        setLoginParams({
          returnUrl,
          origin,
          timestamp: timestamp || '',
          crossDomain,
        });
        setIsValidRequest(true);
      } else {
        setError('未授权的域名请求');
      }
    } else {
      setError('无效的跨域登录请求');
    }
  }, [allowedOrigins]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginParams || !isValidRequest) {
      setError('无效的登录请求');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // 使用 Supabase 进行认证
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        throw new Error(authError?.message || '登录失败');
      }

      // 生成认证令牌
      const authToken = generateAuthToken(data.user);
      
      // 构建返回URL
      const redirectUrl = buildRedirectUrl(loginParams.returnUrl, {
        loginSuccess: 'true',
        authToken: authToken,
        userInfo: encodeURIComponent(JSON.stringify({
          id: data.user.id,
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
          email: data.user.email,
          avatar: data.user.user_metadata?.avatar_url,
        }))
      });

      // 如果是弹窗模式，向父窗口发送消息
      if (window.opener) {
        window.opener.postMessage({
          type: 'LOGIN_SUCCESS',
          data: {
            user: {
              id: data.user.id,
              username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
              email: data.user.email,
              avatar: data.user.user_metadata?.avatar_url,
            },
            token: authToken,
          }
        }, loginParams.origin);
        
        // 关闭弹窗
        window.close();
      } else {
        // 直接重定向
        window.location.href = redirectUrl;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      // 向父窗口发送取消消息
      window.opener.postMessage({
        type: 'LOGIN_WINDOW_CLOSED'
      }, loginParams?.origin || '*');
      window.close();
    } else if (loginParams?.returnUrl) {
      // 重定向回原页面
      window.location.href = loginParams.returnUrl;
    }
  };

  // 生成认证令牌（简化版本）
  const generateAuthToken = (user: { id: string; email?: string; user_metadata?: { username?: string } }): string => {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username || user.email?.split('@')[0],
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24小时过期
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  };

  // 构建重定向URL
  const buildRedirectUrl = (baseUrl: string, params: Record<string, string>): string => {
    const url = new URL(baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  };

  if (!isValidRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">访问被拒绝</CardTitle>
            <CardDescription>
              {error || '无效的跨域登录请求'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.close()} 
              variant="outline" 
              className="w-full"
            >
              关闭窗口
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>领创账号跨域登录</CardTitle>
          <CardDescription>
            来自 <strong>{loginParams?.origin}</strong> 的登录请求
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                取消
              </Button>
            </div>
          </form>

          {/* 忘记密码和注册链接 */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-center space-x-6 text-sm">
              <Link
                href={`/auth/forgot-password?returnUrl=${encodeURIComponent(loginParams?.returnUrl || '')}&origin=${encodeURIComponent(loginParams?.origin || '')}&crossDomain=true${loginParams?.timestamp ? `&timestamp=${loginParams.timestamp}` : ''}`}
                className="text-blue-600 hover:text-blue-800 underline underline-offset-4 transition-colors"
              >
                忘记密码？
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href={`/auth/sign-up?returnUrl=${encodeURIComponent(loginParams?.returnUrl || '')}&origin=${encodeURIComponent(loginParams?.origin || '')}&crossDomain=true${loginParams?.timestamp ? `&timestamp=${loginParams.timestamp}` : ''}`}
                className="text-blue-600 hover:text-blue-800 underline underline-offset-4 transition-colors"
              >
                注册账号
              </Link>
            </div>

            <div className="border-t pt-4 text-center text-sm text-gray-500">
              <p>登录后将返回到原网站</p>
              <p className="mt-1 text-xs break-all">
                <strong>返回地址:</strong> {loginParams?.returnUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
