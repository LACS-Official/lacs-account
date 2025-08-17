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
import { InviteCode } from "@/lib/invite-codes";
import { Copy, Plus, RefreshCw } from "lucide-react";

export function InviteCodeManager() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 获取邀请码列表
  const fetchInviteCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-invite-code');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API 返回的不是 JSON 格式');
      }

      const data = await response.json();

      if (data.success) {
        setInviteCodes(data.inviteCodes);
      } else {
        setMessage(data.error || '获取邀请码列表失败');
      }
    } catch (error) {
      console.error('获取邀请码列表失败:', error);
      setMessage(`获取邀请码列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成新的邀请码
  const generateInviteCode = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/generate-invite-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API 返回的不是 JSON 格式');
      }

      const data = await response.json();

      if (data.success) {
        setMessage(`邀请码 ${data.code} 生成成功！`);
        fetchInviteCodes(); // 刷新列表
      } else {
        setMessage(data.error || '生成邀请码失败');
      }
    } catch (error) {
      console.error('生成邀请码失败:', error);
      setMessage(`生成邀请码失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制邀请码到剪贴板
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`邀请码 ${code} 已复制到剪贴板`);
    } catch {
      setMessage('复制失败');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  return (
    <div className="space-y-6">
      {/* 操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle>生成邀请码</CardTitle>
          <CardDescription>
            点击下方按钮生成新的邀请码，每个邀请码只能使用一次
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={generateInviteCode} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              {isGenerating ? '生成中...' : '生成邀请码'}
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchInviteCodes} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              刷新列表
            </Button>
          </div>
          {message && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm">{message}</p>
              {message.includes('API 返回的不是 JSON 格式') && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    可能需要先设置数据库表。请访问{" "}
                    <a href="/setup-database" className="text-blue-600 hover:underline">
                      数据库设置页面
                    </a>{" "}
                    完成初始化。
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 邀请码列表 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请码列表</CardTitle>
          <CardDescription>
            您创建的所有邀请码及其使用状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>加载中...</p>
            </div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无邀请码</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inviteCodes.map((inviteCode) => (
                <div
                  key={inviteCode.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-lg font-bold">
                      {inviteCode.code}
                    </div>
                    <Badge variant={inviteCode.is_used ? "secondary" : "default"}>
                      {inviteCode.is_used ? "已使用" : "未使用"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      <div>创建时间: {formatDate(inviteCode.created_at)}</div>
                      {inviteCode.is_used && inviteCode.used_at && (
                        <div>使用时间: {formatDate(inviteCode.used_at)}</div>
                      )}
                      {inviteCode.used_by_email && (
                        <div>使用者: {inviteCode.used_by_email}</div>
                      )}
                    </div>
                    {!inviteCode.is_used && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(inviteCode.code)}
                        className="flex items-center gap-2"
                      >
                        <Copy size={14} />
                        复制
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
