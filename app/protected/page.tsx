import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon, User, Mail, Calendar, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          欢迎访问您的账户页面
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              账户信息
            </CardTitle>
            <CardDescription>
              您的基本账户详情
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">邮箱地址</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">注册时间</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">账户状态</p>
                <p className="text-sm text-muted-foreground">
                  {user.email_confirmed_at ? '已验证' : '待验证'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>账户统计</CardTitle>
            <CardDescription>
              您的账户使用情况
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">用户 ID</span>
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {user.id.slice(0, 8)}...
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">最后登录</span>
              <span className="text-sm text-muted-foreground">
                {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '首次登录'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">认证方式</span>
              <span className="text-sm text-muted-foreground">
                邮箱密码
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
