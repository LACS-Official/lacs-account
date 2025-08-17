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
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface CrossDomainParams {
  returnUrl?: string;
  origin?: string;
  timestamp?: string;
  crossDomain?: string;
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "发生了错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">检查您的邮箱</CardTitle>
            <CardDescription>密码重置说明已发送</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              如果您使用邮箱和密码注册，您将收到一封密码重置邮件。
            </p>
            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回登录
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">重置您的密码</CardTitle>
            <CardDescription>
              输入您的邮箱，我们将向您发送重置密码的链接
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "发送中..." : "发送重置邮件"}
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
      )}
    </div>
  );
}
