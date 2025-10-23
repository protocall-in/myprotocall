import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mail, Share2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function InviteMethodsModal({ open, onClose, referralLink, referralCode }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    `Hi! Join me on Protocol, India's largest retail investor community where we make informed trading decisions together. Use my referral link: ${referralLink}`
  );

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🚀 Join Protocol - India's Largest Retail Investor Community!\n\n` +
      `Hey! I've been using Protocol to connect with fellow traders and make informed investment decisions. ` +
      `The community insights and admin recommendations have been incredibly valuable.\n\n` +
      `Join using my referral link: ${referralLink}\n\n` +
      `Let's grow our trading knowledge together! 📈`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(
      `Join Protocol - India's Largest Retail Investor Community! ${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = "Join Protocol Trading Community";
    const body = encodeURIComponent(message);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Invite Traders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Share Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Quick Share</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleWhatsAppShare} className="bg-green-500 hover:bg-green-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleTelegramShare} className="bg-blue-500 hover:bg-blue-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                Telegram
              </Button>
            </div>
          </div>

          {/* Email Invitation */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Send Email Invitation</Label>
            <Input
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Textarea
              placeholder="Customize your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <Button onClick={handleEmailShare} variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>

          {/* Copy Link */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Copy Referral Link</Label>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="text-xs" />
              <Button onClick={copyLink} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}