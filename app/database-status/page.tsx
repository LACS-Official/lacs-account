"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DatabaseStatus {
  success: boolean;
  message: string;
  timestamp?: string;
  tableExists?: boolean;
  sampleData?: unknown[];
  userAuthenticated?: boolean;
  userEmail?: string;
  error?: string;
  details?: string;
  suggestion?: string;
}

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkDatabaseStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        success: false,
        message: '无法连接到 API',
        error: '无法连接到 API',
        details: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = () => {
    if (!status) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    if (status.success) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">检查中...</Badge>;
    if (status.success) return <Badge variant="default" className="bg-green-500">正常</Badge>;
    return <Badge variant="destructive">异常</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">数据库状态检查</h1>
          <p className="text-center text-muted-foreground">
            检查 Supabase 数据库连接和邀请码表状态
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon()}
                  数据库连接状态
                </CardTitle>
                {getStatusBadge()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkDatabaseStatus}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                刷新状态
              </Button>
            </div>
            <CardDescription>
              最后检查时间: {status?.timestamp ? new Date(status.timestamp).toLocaleString('zh-CN') : '未知'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>正在检查数据库状态...</p>
              </div>
            ) : status ? (
              <div className="space-y-4">
                {status.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">表状态</h4>
                        <p className="text-lg">{status.tableExists ? '✅ invite_codes 表存在' : '❌ 表不存在'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">用户认证</h4>
                        <p className="text-lg">
                          {status.userAuthenticated ? `✅ 已登录 (${status.userEmail})` : '❌ 未登录'}
                        </p>
                      </div>
                    </div>
                    
                    {status.sampleData && status.sampleData.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">示例数据</h4>
                        <div className="bg-gray-100 p-3 rounded-md">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(status.sampleData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-green-800 font-medium">✅ 数据库连接正常</p>
                      <p className="text-green-700 text-sm mt-1">
                        邀请码系统已准备就绪，可以正常使用。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-800 font-medium">❌ {status.error}</p>
                      {status.details && (
                        <p className="text-red-700 text-sm mt-1">详细信息: {status.details}</p>
                      )}
                      {status.suggestion && (
                        <p className="text-red-700 text-sm mt-2">建议: {status.suggestion}</p>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <p className="text-blue-800 font-medium">🔧 解决步骤</p>
                      <ol className="text-blue-700 text-sm mt-2 space-y-1 list-decimal list-inside">
                        <li>访问 <a href="/setup-database" className="underline">数据库设置页面</a></li>
                        <li>在 Supabase Dashboard 中执行 SQL 脚本</li>
                        <li>刷新此页面验证状态</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">点击刷新按钮检查数据库状态</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">设置指南</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                查看详细的数据库设置步骤
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/setup-database">查看指南</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">邀请码管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                生成和管理邀请码
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/jhm">管理邀请码</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">测试注册</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                测试邀请码注册流程
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/auth/sign-up">测试注册</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
