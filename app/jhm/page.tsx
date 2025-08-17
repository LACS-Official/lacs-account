import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteCodeManager } from "@/components/invite-code-manager";

export default async function InviteCodePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">邀请码管理</h1>
          <p className="text-center text-muted-foreground">
            生成和管理邀请码，用于新用户注册
          </p>
        </div>
        <InviteCodeManager />
      </div>
    </div>
  );
}
