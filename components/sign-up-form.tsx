"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

interface CrossDomainParams {
  returnUrl?: string;
  origin?: string;
  timestamp?: string;
  crossDomain?: string;
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [crossDomainParams, setCrossDomainParams] = useState<CrossDomainParams>({});
  const router = useRouter();

  useEffect(() => {
    // 检查是否来自跨域登录页面
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    const origin = urlParams.get('origin');
    const timestamp = urlParams.get('timestamp');
    const crossDomain = urlParams.get('crossDomain');

    if (returnUrl || origin || crossDomain) {
      setCrossDomainParams({
        returnUrl: returnUrl || undefined,
        origin: origin || undefined,
        timestamp: timestamp || undefined,
        crossDomain: crossDomain || undefined,
      });
    }
  }, []);

  const handleBack = () => {
    if (crossDomainParams.returnUrl && crossDomainParams.origin) {
      // 返回跨域登录页面
      const params = new URLSearchParams();
      if (crossDomainParams.returnUrl) params.set('returnUrl', crossDomainParams.returnUrl);
      if (crossDomainParams.origin) params.set('origin', crossDomainParams.origin);
      if (crossDomainParams.timestamp) params.set('timestamp', crossDomainParams.timestamp);
      if (crossDomainParams.crossDomain) params.set('crossDomain', crossDomainParams.crossDomain);

      router.push(`/cross-domain-login?${params.toString()}`);
    } else {
      // 返回普通登录页面
      router.push('/auth/login');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("密码不匹配");
      setIsLoading(false);
      return;
    }

    if (!inviteCode.trim()) {
      setError("请输入邀请码");
      setIsLoading(false);
      return;
    }

    try {
      // 验证邀请码
      const inviteResponse = await fetch('/api/validate-invite-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: inviteCode }),
      });

      if (!inviteResponse.ok) {
        setError(`验证邀请码失败: HTTP ${inviteResponse.status}`);
        setIsLoading(false);
        return;
      }

      const contentType = inviteResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('邀请码验证服务暂时不可用，请稍后重试');
        setIsLoading(false);
        return;
      }

      const inviteData = await inviteResponse.json();

      if (!inviteData.isValid) {
        setError(inviteData.message || "邀请码无效");
        setIsLoading(false);
        return;
      }

      // 注册用户
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });

      if (error) throw error;

      // 标记邀请码为已使用
      await fetch('/api/validate-invite-code', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: inviteCode,
          userEmail: email
        }),
      });

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "发生了错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>创建新的领创账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">确认密码</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="invite-code">邀请码</Label>
                </div>
                <Input
                  id="invite-code"
                  type="text"
                  placeholder="请输入6位邀请码"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono"
                />

                {/* 获取邀请码说明 */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/img/qrcode_for_gh_a00e889e59b3_258.jpg"
                        alt="微信公众号二维码"
                        className="w-24 h-24 rounded-lg border"
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-medium text-sm mb-2">如何获取邀请码？</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        扫描二维码关注公众号，点击底部&quot;领创账号&quot;，再点击&quot;获取邀请码&quot;获取
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "创建账户中..." : "注册"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              已有账户？{" "}
              <Link
                href={crossDomainParams.returnUrl && crossDomainParams.origin
                  ? `/cross-domain-login?returnUrl=${encodeURIComponent(crossDomainParams.returnUrl)}&origin=${encodeURIComponent(crossDomainParams.origin)}&crossDomain=true${crossDomainParams.timestamp ? `&timestamp=${crossDomainParams.timestamp}` : ''}`
                  : "/auth/login"
                }
                className="underline underline-offset-4"
              >
                立即登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
