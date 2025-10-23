import React, { useState, useRef } from 'react';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2, ShieldAlert, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function GeneralSettings({ user, onUpdate }) {
  const [newImage, setNewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!newImage) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file: newImage });
      await User.updateMyUserData({ profile_image_url: file_url });
      toast.success('Profile picture updated!');
      onUpdate(false); // Close modal to refresh data
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error('Failed to upload image.');
    } finally {
      setIsUploading(false);
      setNewImage(null);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await User.updateMyUserData({ is_deactivated: true });
      toast.success("Your account has been deactivated.");
      await User.logout();
      window.location.href = '/'; // Redirect to home
    } catch (error) {
      toast.error("Failed to deactivate account.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Picture Section */}
      <div className="flex items-center gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={newImage ? URL.createObjectURL(newImage) : user.profile_image_url} alt={user.display_name} />
          <AvatarFallback>{user.display_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Change Picture
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {newImage && (
              <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Save'}
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">JPG, PNG, or GIF. Max size of 2MB.</p>
        </div>
      </div>

      {/* Account Deletion Section */}
      <div>
        <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Danger Zone
        </h3>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-800">Deactivate Account</h4>
            <p className="text-sm text-red-700">This action is permanent and cannot be undone.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent. Your data will be marked for deletion and you will be logged out immediately. You cannot undo this.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                  Yes, Deactivate My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
         <p className="text-xs text-slate-500 mt-4">
            Note on Password Change: Your account is secured via Google Authentication. To change your password, please manage it through your Google account settings.
          </p>
      </div>
    </div>
  );
}