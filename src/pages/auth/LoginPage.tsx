import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Phone, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的 11 位手机号");
const codeSchema = z.string().regex(/^\d{6}$/, "请输入 6 位验证码");

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: "+86" + phone,
    });
    setSending(false);
    if (error) {
      toast({ title: "验证码发送失败", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "验证码已发送", description: "请查收短信" });
    setStep("code");
    startCooldown();
  };

  const verifyCode = async () => {
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: "+86" + phone,
      token: code,
      type: "sms",
    });
    setVerifying(false);
    if (error) {
      toast({ title: "验证失败", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "登录成功" });
    navigate({ to: "/me" });
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] container max-w-sm pt-8 pb-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回
      </Link>

      <div className="space-y-1 mb-8">
        <h1 className="font-display text-2xl">登录中古识物</h1>
        <p className="text-sm text-muted-foreground">登录后免费无限识别，发布、点赞、收藏中古好物</p>
      </div>

      {step === "phone" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> 手机号
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="请输入 11 位手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="h-11 text-base"
            />
          </div>
          <Button onClick={sendCode} disabled={sending} className="w-full h-11">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "获取验证码"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            验证码已发送至 <span className="text-foreground font-medium">+86 {phone}</span>
            <button
              type="button"
              className="ml-2 text-primary underline-offset-2 hover:underline"
              onClick={() => { setStep("phone"); setCode(""); }}
            >
              修改
            </button>
          </div>
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="6 位验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-11 text-base tracking-widest text-center"
          />
          <Button onClick={verifyCode} disabled={verifying} className="w-full h-11">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "登录"}
          </Button>
          <Button
            variant="ghost"
            onClick={sendCode}
            disabled={cooldown > 0 || sending}
            className="w-full h-9 text-sm"
          >
            {cooldown > 0 ? `${cooldown}s 后可重发` : "重新发送验证码"}
          </Button>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-border/40">
        <button
          type="button"
          disabled
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground cursor-not-allowed"
        >
          <MessageCircle className="w-4 h-4" /> 微信登录（即将上线）
        </button>
      </div>

      <p className="mt-8 text-[11px] text-muted-foreground text-center leading-relaxed">
        登录即代表同意《用户协议》和《隐私政策》
      </p>
    </div>
  );
}
