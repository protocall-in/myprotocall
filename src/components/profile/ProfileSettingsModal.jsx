import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Award, Crown, Shield } from "lucide-react";
import GeneralSettings from "./tabs/GeneralSettings";
import ReferralInfo from "./tabs/ReferralInfo";
import SubscriptionInfo from "./tabs/SubscriptionInfo";

export default function ProfileSettingsModal({ open, onOpenChange, user, subscription, referrals }) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account details, subscription, and community status.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general"><Settings className="w-4 h-4 mr-2" />General</TabsTrigger>
              <TabsTrigger value="referrals"><Award className="w-4 h-4 mr-2" />Referrals</TabsTrigger>
              <TabsTrigger value="subscription"><Crown className="w-4 h-4 mr-2" />Subscription</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="pt-4">
              <GeneralSettings user={user} onUpdate={onOpenChange} />
            </TabsContent>
            <TabsContent value="referrals" className="pt-4">
              <ReferralInfo referrals={referrals} />
            </TabsContent>
            <TabsContent value="subscription" className="pt-4">
              <SubscriptionInfo subscription={subscription} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}