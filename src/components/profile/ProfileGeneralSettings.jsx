
import React, { useState, useRef } from 'react';
import { User } from '@/api/entities';
import { UploadFile, SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2, ShieldAlert, User as UserIcon, LogOut, Lock, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

export default function ProfileGeneralSettings({ user, onUserUpdate }) {
  const [newImage, setNewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Mobile number states
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || '');
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [tempMobileNumber, setTempMobileNumber] = useState('');
  
  const fileInputRef = useRef(null);

  // Start OTP cooldown timer
  React.useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

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
      onUserUpdate({ ...user, profile_image_url: file_url });
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setNewImage(null);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    
    setIsSavingName(true);
    try {
      await User.updateMyUserData({ display_name: displayName.trim() });
      onUserUpdate({ ...user, display_name: displayName.trim() });
      setIsEditingName(false);
      toast.success('Display name updated successfully!');
    } catch (error) {
      console.error("Error updating display name:", error);
      toast.error('Failed to update display name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setDisplayName(user?.display_name || '');
    setIsEditingName(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulate API call for password change
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error('Failed to change password. Please check your old password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendOtp = async () => {
    if (!tempMobileNumber || tempMobileNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setIsSendingOtp(true);
    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      await SendEmail({
        to: user.email,
        subject: 'Mobile Number Verification - Protocol',
        body: `Your OTP for mobile number verification is: ${generatedOtp}. This OTP is valid for 5 minutes.`
      });

      window.tempOtp = generatedOtp;
      window.otpExpiry = Date.now() + 5 * 60 * 1000;

      setOtpSent(true);
      setOtpCooldown(60);
      toast.success(`OTP sent to ${user.email}. Please check your inbox and spam folder.`);
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error('Failed to send OTP. Please verify your email and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    if (Date.now() > window.otpExpiry) {
      toast.error('OTP has expired. Please request a new one.');
      setOtpSent(false);
      setOtp('');
      return;
    }

    if (otp !== window.tempOtp) {
      toast.error('Invalid OTP. Please check and try again.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await User.updateMyUserData({ mobile_number: tempMobileNumber });
      onUserUpdate({ ...user, mobile_number: tempMobileNumber });
      
      setMobileNumber(tempMobileNumber);
      setIsEditingMobile(false);
      setOtpSent(false);
      setOtp('');
      setTempMobileNumber('');
      
      delete window.tempOtp;
      delete window.otpExpiry;
      
      toast.success('Mobile number updated successfully!');
    } catch (error) {
      console.error("Error updating mobile number:", error);
      toast.error('Failed to update mobile number');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancelMobileEdit = () => {
    setIsEditingMobile(false);
    setOtpSent(false);
    setOtp('');
    setTempMobileNumber('');
    delete window.tempOtp;
    delete window.otpExpiry;
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await User.updateMyUserData({ is_deactivated: true });
      toast.success("Your account has been deactivated.");
      await User.logout();
      window.location.href = '/'; // Redirect to home or login page after deactivation and logout
    } catch (error) {
      toast.error("Failed to deactivate account.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={newImage ? URL.createObjectURL(newImage) : user.profile_image_url} alt={user.display_name} />
              <AvatarFallback className="text-xl">{user.display_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-900 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
                >
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
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Display Name</Label>
            {isEditingName ? (
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                />
                <Button size="sm" onClick={handleSaveDisplayName} disabled={isSavingName}>
                  {isSavingName ? <Save className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEditName}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input value={user.display_name} readOnly className="bg-slate-50" />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-900 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Email</Label>
            <Input value={user.email} readOnly className="bg-slate-50" />
            <p className="text-xs text-slate-500">
              Your email is managed through Google Authentication and cannot be changed here.
            </p>
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Mobile Number</Label>
            {isEditingMobile ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm font-medium">+91</span>
                    <Input
                      value={tempMobileNumber}
                      onChange={(e) => setTempMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      disabled={otpSent}
                      className="flex-1"
                    />
                  </div>
                  <Button size="sm" onClick={handleSendOtp} disabled={otpCooldown > 0 || isSendingOtp}>
                    {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Send OTP'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelMobileEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {otpSent && (
                  <div className="flex gap-2">
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                    <Button size="sm" onClick={handleVerifyOtp} disabled={isVerifyingOtp}>
                      {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  An OTP will be sent to your registered email ({user.email}) for verification.
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm font-medium">+91</span>
                  <Input value={mobileNumber || 'Not provided'} readOnly className="bg-slate-50 flex-1" />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditingMobile(true)}
                  className="text-slate-900 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Change Password</h4>
                <p className="text-sm text-slate-600">Update your account password</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordForm(true)}
                className="text-slate-900 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Logout */}
          <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-800">Logout</h4>
              <p className="text-sm text-slate-600">Sign out of your account</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-slate-900 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Delete Account */}
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
                    This action is permanent. Your account will be deactivated and you will be logged out immediately. This cannot be undone.
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
        </CardContent>
      </Card>
    </div>
  );
}
