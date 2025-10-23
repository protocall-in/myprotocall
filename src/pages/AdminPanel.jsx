
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, TrustScoreLog, ModerationLog, ContactInquiry, Advisor, PlatformSetting, Feedback } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Search, User as UserIcon, TrendingUp, TrendingDown, Clock, Mail, Check, X, BookUser, Settings, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const updateTrustScore = async (user, amount, reason, moderatorId) => {
    if (!user || !moderatorId) return null;

    const currentScore = user.trust_score || 50;
    const newScore = Math.max(0, Math.min(100, currentScore + amount));

    if (newScore === currentScore) return user;

    try {
        await User.update(user.id, { trust_score: newScore });
        await TrustScoreLog.create({
            user_id: user.id,
            change_amount: amount,
            reason: reason,
            new_score: newScore,
            moderator_id: moderatorId,
        });
        return { ...user, trust_score: newScore };
    } catch (error) {
        console.error("Failed to update trust score:", error);
        return null;
    }
};


export default function AdminPanel() {
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedUser, setSearchedUser] = useState(null);
    const [scoreLogs, setScoreLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adjustment, setAdjustment] = useState({ amount: '', reason: '' });
    const isMountedRef = useRef(true);

    const [moderationLogs, setModerationLogs] = useState([]);
    const [contactInquiries, setContactInquiries] = useState([]);
    const [selectedTab, setSelectedTab] = useState('users');
    const [users, setUsers] = useState([]); // State for all users list
    const [advisorApps, setAdvisorApps] = useState([]); // New state for advisor applications
    const [commissionRate, setCommissionRate] = useState(''); // New state for commission rate
    const [pledgesEnabled, setPledgesEnabled] = useState(false); // New state for pledges toggle
    const [feedbackItems, setFeedbackItems] = useState([]); // New state for feedback

    useEffect(() => {
        isMountedRef.current = true;
        
        const fetchAdminUser = async () => {
            try {
                const user = await User.me();
                if (!isMountedRef.current) return;
                
                // Auto-grant admin access if not already set, defaulting to 'super_admin' for initial admin
                if (user && !user.is_admin) {
                    try {
                        await User.updateMyUserData({ is_admin: true, app_role: 'super_admin' });
                        const updatedUser = { ...user, is_admin: true, app_role: 'super_admin' };
                        setCurrentUser(updatedUser);
                    } catch (updateError) {
                        console.error("Could not grant admin access:", updateError);
                        // Local override for development if API update fails
                        setCurrentUser({ ...user, is_admin: true, app_role: 'super_admin' });
                    }
                } else if (user && user.is_admin) {
                    // Ensure app_role is set for existing admins
                    setCurrentUser({ ...user, app_role: user.app_role || 'super_admin' }); // Default existing admins to 'super_admin' if app_role missing
                } else {
                    // If no user found, redirect (shouldn't happen if logged in)
                    window.location.href = createPageUrl("Dashboard");
                }
            } catch (error) {
                if (!isMountedRef.current) return;
                console.error("Error fetching admin user:", error);
                window.location.href = createPageUrl("Dashboard");
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        };
        
        fetchAdminUser();
        
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadAllUsers = useCallback(async () => {
        try {
            const allUsers = await User.list();
            if(isMountedRef.current) setUsers(allUsers);
        } catch (error) {
            console.error("Could not load users:", error);
        }
    }, [isMountedRef]);

    const loadAdvisorApplications = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const apps = await Advisor.list('-created_date');
            if (isMountedRef.current) setAdvisorApps(apps);
        } catch (error) {
            console.error("Could not load advisor applications:", error);
        }
    }, [isMountedRef]);

    const loadPlatformSettings = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const settings = await PlatformSetting.filter({ setting_key: 'global_commission_rate' });
            if (isMountedRef.current && settings.length > 0) {
                setCommissionRate(settings[0].setting_value);
            } else if (isMountedRef.current) {
                // Set a default value if not found
                setCommissionRate('20');
            }

            // Load pledge settings
            const pledgeSettings = await PlatformSetting.filter({ setting_key: 'pledges_enabled' });
            if (isMountedRef.current) {
                setPledgesEnabled(pledgeSettings.length > 0 ? pledgeSettings[0].setting_value === 'true' : false);
            }
        } catch (error) {
            console.error("Could not load platform settings:", error);
        }
    }, [isMountedRef]);

    const loadFeedbackItems = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const feedback = await Feedback.list('-created_date');
            if (isMountedRef.current) setFeedbackItems(feedback);
        } catch (error) {
            console.error("Could not load feedback items:", error);
        }
    }, [isMountedRef]);


    useEffect(() => {
        if(currentUser?.is_admin){
            loadAllUsers();
            loadAdvisorApplications();
            loadPlatformSettings();
            loadFeedbackItems();
        }
    }, [currentUser, loadAllUsers, loadAdvisorApplications, loadPlatformSettings, loadFeedbackItems]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm || !isMountedRef.current) return;
        
        try {
            const users = await User.filter({ email: searchTerm }, '', 1);
            if (!isMountedRef.current) return;
            
            if (users.length > 0) {
                setSearchedUser(users[0]);
                const logs = await TrustScoreLog.filter({ user_id: users[0].id }, '-created_date', 50);
                if (isMountedRef.current) {
                    setScoreLogs(logs);
                }
            } else {
                toast.error("User not found.");
                setSearchedUser(null);
                setScoreLogs([]);
            }
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error searching user:", error);
            toast.error("Error searching for user. Please try again.");
        }
    };

    const handleScoreAdjustment = async (e) => {
        e.preventDefault();
        if (!isMountedRef.current) return;
        
        const amount = parseInt(adjustment.amount);
        if (!searchedUser || isNaN(amount) || !adjustment.reason) {
            toast.error("Please provide a valid amount and reason.");
            return;
        }

        try {
            const updatedUser = await updateTrustScore(searchedUser, amount, adjustment.reason, currentUser.id);
            if (!isMountedRef.current) return;

            if (updatedUser) {
                setSearchedUser(updatedUser);
                const logs = await TrustScoreLog.filter({ user_id: updatedUser.id }, '-created_date', 50);
                if (isMountedRef.current) {
                    setScoreLogs(logs);
                    setAdjustment({ amount: '', reason: '' });
                    toast.success("Trust score updated successfully!");
                }
            } else {
                toast.error("Failed to update score.");
            }
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Error updating score:", error);
            toast.error("Error updating score. Please try again.");
        }
    };

    const handleAdvisorApprove = async (appId, userId) => {
        if(!isMountedRef.current) return;
        try {
            await Advisor.update(appId, { status: 'approved' });
            await User.update(userId, { app_role: 'finfluencer' }); // Or a new 'advisor' role
            toast.success("Advisor approved successfully!");
            if(isMountedRef.current) {
                loadAdvisorApplications();
                loadAllUsers(); // Refresh user list to reflect role change
            }
        } catch (error) {
            console.error("Failed to approve advisor:", error);
            toast.error("Failed to approve advisor.");
        }
    };
    
    const handleAdvisorReject = async (appId) => {
        if(!isMountedRef.current) return;
        try {
            await Advisor.update(appId, { status: 'rejected' });
            toast.success("Advisor rejected.");
            if(isMountedRef.current) loadAdvisorApplications();
        } catch (error) {
            console.error("Failed to reject advisor:", error);
            toast.error("Failed to reject advisor.");
        }
    };

    const handleAdvisorSuspend = async (appId) => {
        if(!isMountedRef.current) return;
        try {
            await Advisor.update(appId, { status: 'suspended' });
            toast.success("Advisor suspended.");
            if(isMountedRef.current) loadAdvisorApplications();
        } catch (error) {
            console.error("Failed to suspend advisor:", error);
            toast.error("Failed to suspend advisor.");
        }
    };

    const handleAdvisorReinstate = async (appId) => {
        if(!isMountedRef.current) return;
        try {
            await Advisor.update(appId, { status: 'approved' });
            toast.success("Advisor reinstated.");
            if(isMountedRef.current) loadAdvisorApplications();
        } catch (error) {
            console.error("Failed to reinstate advisor:", error);
            toast.error("Failed to reinstate advisor.");
        }
    };

    const handleCommissionSave = async () => {
        if(!isMountedRef.current) return;
        if (commissionRate === '' || isNaN(parseFloat(commissionRate))) {
            toast.error("Please enter a valid commission rate.");
            return;
        }
        try {
            const settings = await PlatformSetting.filter({ setting_key: 'global_commission_rate' });
            if(settings.length > 0) {
                await PlatformSetting.update(settings[0].id, { setting_value: commissionRate });
            } else {
                await PlatformSetting.create({ setting_key: 'global_commission_rate', setting_value: commissionRate, description: 'Global commission rate for advisor subscriptions (e.g., 20 for 20%).' });
            }
            toast.success("Commission rate updated!");
            if(isMountedRef.current) loadPlatformSettings();
        } catch (error) {
            console.error("Failed to update commission rate:", error);
            toast.error("Failed to update commission rate.");
        }
    };

    const handlePledgeToggle = async () => {
        if(!isMountedRef.current) return;
        try {
            const newStatus = !pledgesEnabled;
            const settings = await PlatformSetting.filter({ setting_key: 'pledges_enabled' });
            
            if(settings.length > 0) {
                await PlatformSetting.update(settings[0].id, { setting_value: newStatus.toString() });
            } else {
                await PlatformSetting.create({ 
                    setting_key: 'pledges_enabled', 
                    setting_value: newStatus.toString(), 
                    description: 'Controls whether users can make pledges system-wide.' 
                });
            }
            
            setPledgesEnabled(newStatus);
            toast.success(`Pledges have been ${newStatus ? 'enabled' : 'disabled'}!`);
            
        } catch (error) {
            console.error("Failed to update pledge settings:", error);
            toast.error("Failed to update pledge settings.");
        }
    };

    const loadModerationLogs = useCallback(async () => {
        if (!isMountedRef.current) return;
        
        try {
            const logs = await ModerationLog.filter({ admin_reviewed: false }, '-created_date', 50);
            if (isMountedRef.current) {
                setModerationLogs(logs);
            }
        } catch (error) {
            console.error("Error loading moderation logs:", error);
        }
    }, [isMountedRef]);

    const handleModerationAction = async (logId, action, notes) => {
        if (!isMountedRef.current) return;
        
        try {
            await ModerationLog.update(logId, {
                admin_reviewed: true,
                admin_notes: notes,
                status: action
            });
            
            if (isMountedRef.current) {
                loadModerationLogs();
                toast.success("Moderation action applied!");
            }
        } catch (error) {
            console.error("Error updating moderation log:", error);
            toast.error("Error performing moderation action. Please try again.");
        }
    };
    
    const loadContactInquiries = useCallback(async () => {
        if (!isMountedRef.current) return;
        try {
            const inquiries = await ContactInquiry.list('-created_date', 100);
            if (isMountedRef.current) {
                setContactInquiries(inquiries);
            }
        } catch (error) {
            console.error("Error loading contact inquiries:", error);
        }
    }, [isMountedRef]);

    const handleInquiryStatusChange = async (inquiryId, newStatus) => {
        if (!isMountedRef.current) return;
        try {
            await ContactInquiry.update(inquiryId, { status: newStatus });
            if (isMountedRef.current) {
                loadContactInquiries();
                toast.success('Inquiry status updated!');
            }
        } catch (error) {
            console.error("Error updating inquiry status:", error);
            toast.error('Failed to update status.');
        }
    };

    const handleFeedbackStatusChange = async (feedbackId, newStatus) => {
        if (!isMountedRef.current) return;
        try {
            await Feedback.update(feedbackId, { status: newStatus });
            if (isMountedRef.current) {
                loadFeedbackItems();
                toast.success('Feedback status updated!');
            }
        } catch (error) {
            console.error("Error updating feedback status:", error);
            toast.error('Failed to update status.');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!currentUser || !isMountedRef.current) return;

        const currentModeratorRole = currentUser.app_role || 'trader'; 

        // Current user must be at least sub_admin to change roles
        if (!['sub_admin', 'admin', 'super_admin'].includes(currentModeratorRole)) {
            toast.error("You don't have permission to change roles.");
            return;
        }

        const userToModify = users.find(u => u.id === userId);
        if (!userToModify) {
            toast.error("User not found for role change.");
            return;
        }

        // Logic based on moderator's role and target role/user status
        if (currentModeratorRole === 'admin') {
            if (newRole === 'admin' || newRole === 'super_admin') {
                toast.error("Admins cannot elevate users to Admin or Super Admin roles.");
                return;
            }
            if (userToModify.app_role === 'admin' || userToModify.app_role === 'super_admin') {
                toast.error("Admins cannot change the role of other Admin or Super Admin users.");
                return;
            }
        }
        
        if (currentModeratorRole === 'sub_admin') {
            if (['sub_admin', 'admin', 'super_admin'].includes(newRole)) {
                toast.error("Sub-admins cannot assign administrative roles.");
                return;
            }
            if (['sub_admin', 'admin', 'super_admin'].includes(userToModify.app_role)) {
                toast.error("Sub-admins cannot change roles of administrative users.");
                return;
            }
        }

        try {
            let updatedFields = { app_role: newRole };
            // Determine the is_admin flag based on the new app_role
            if (['admin', 'super_admin', 'sub_admin'].includes(newRole)) {
                updatedFields.is_admin = true;
            } else { // trader, finfluencer
                updatedFields.is_admin = false;
            }

            await User.update(userId, updatedFields);
            toast.success("User role updated successfully!");
            
            if (isMountedRef.current) {
                loadAllUsers(); // Refresh user list
                if (searchedUser?.id === userId) {
                    setSearchedUser(prev => ({ ...prev, app_role: newRole, is_admin: updatedFields.is_admin }));
                }
            }
        } catch (error) {
            toast.error("Failed to update user role.");
            console.error("Error updating role:", error);
        }
    };

    // Check access level for advisor management
    const canManageAdvisors = currentUser && ['admin', 'super_admin'].includes(currentUser.app_role);
    const canEditCommission = currentUser && ['admin', 'super_admin'].includes(currentUser.app_role);
    const canTogglePledges = currentUser && ['admin', 'super_admin'].includes(currentUser.app_role);
    
    useEffect(() => {
        if (selectedTab === 'moderation') {
            loadModerationLogs();
        } else if (selectedTab === 'inquiries') {
            loadContactInquiries();
        } else if (selectedTab === 'advisors') {
            loadAdvisorApplications();
        } else if (selectedTab === 'settings') {
            loadPlatformSettings();
        } else if (selectedTab === 'feedback') {
            loadFeedbackItems();
        }
    }, [selectedTab, loadModerationLogs, loadContactInquiries, loadAdvisorApplications, loadPlatformSettings, loadFeedbackItems]);

    if (isLoading) {
        return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Shield className="w-6 h-6 text-red-600" />
                            Admin Control Panel
                        </CardTitle>
                        <CardDescription>Manage users, moderate content, and handle support inquiries.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Tab Navigation */}
                        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                            <Button
                                variant={selectedTab === 'users' ? 'default' : 'outline'}
                                onClick={() => setSelectedTab('users')}
                            >
                                <UserIcon className="w-4 h-4 mr-2" />
                                User Management
                            </Button>
                             <Button
                                variant={selectedTab === 'advisors' ? 'default' : 'outline'}
                                onClick={() => setSelectedTab('advisors')}
                            >
                                <BookUser className="w-4 h-4 mr-2" />
                                Advisor Management
                            </Button>
                            <Button
                                variant={selectedTab === 'moderation' ? 'default' : 'outline'}
                                onClick={() => setSelectedTab('moderation')}
                            >
                                <Shield className="w-4 h-4 mr-2" />
                                Content Moderation
                            </Button>
                            <Button
                                variant={selectedTab === 'inquiries' ? 'default' : 'outline'}
                                onClick={() => setSelectedTab('inquiries')}
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Support Inquiries
                            </Button>
                             <Button
                                variant={selectedTab === 'settings' ? 'default' : 'outline'}
                                onClick={() => setSelectedTab('settings')}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Platform Settings
                            </Button>
                            <Button
                                variant={selectedTab === 'feedback' ? 'default' : 'outline'}
                                onClick={() => setSelectedTab('feedback')}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Feedback
                            </Button>
                        </div>

                        {selectedTab === 'users' && (
                            <>
                                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                                    <Input
                                        type="email"
                                        placeholder="Search user by email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button type="submit"><Search className="w-4 h-4 mr-2" /> Search</Button>
                                </form>
                                <h3 className="text-lg font-semibold mb-4">All Users</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {users.length === 0 ? (
                                        <p className="text-slate-500 text-center py-4">No users found.</p>
                                    ) : (
                                        users.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{user.display_name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge>{user.app_role || 'trader'}</Badge>
                                                    <Select 
                                                        defaultValue={user.app_role || 'trader'}
                                                        onValueChange={(value) => handleRoleChange(user.id, value)}
                                                        // Disable the entire select if current user is an admin and the target user is an admin or super_admin
                                                        disabled={currentUser?.app_role === 'admin' && (user.app_role === 'admin' || user.app_role === 'super_admin')}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Change role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="trader">Trader</SelectItem>
                                                            <SelectItem value="finfluencer">Finfluencer</SelectItem>
                                                            <SelectItem 
                                                                value="sub_admin"
                                                                // Sub-admins cannot assign administrative roles (including other sub-admins) if they are sub-admin
                                                                disabled={currentUser?.app_role === 'sub_admin'}
                                                            >
                                                                Sub-Admin
                                                            </SelectItem>
                                                            <SelectItem 
                                                                value="admin" 
                                                                // Only Super Admin can assign Admin role
                                                                disabled={currentUser?.app_role !== 'super_admin'}
                                                            >
                                                                Admin
                                                            </SelectItem>
                                                            <SelectItem 
                                                                value="super_admin" 
                                                                // Only Super Admin can assign Super Admin role
                                                                disabled={currentUser?.app_role !== 'super_admin'}
                                                            >
                                                                Super Admin
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {selectedTab === 'advisors' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Advisor Management ({advisorApps.length} Total)</h3>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                                            {advisorApps.filter(a => a.status === 'pending_approval').length} Pending
                                        </Badge>
                                        <Badge variant="outline" className="bg-green-50 text-green-800">
                                            {advisorApps.filter(a => a.status === 'approved').length} Approved
                                        </Badge>
                                        <Badge variant="outline" className="bg-red-50 text-red-800">
                                            {advisorApps.filter(a => a.status === 'suspended').length} Suspended
                                        </Badge>
                                    </div>
                                </div>

                                {advisorApps.length === 0 ? (
                                    <p className="text-slate-500">No advisor applications found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {advisorApps.map(app => (
                                            <Card key={app.id} className={`border-l-4 ${
                                                app.status === 'pending_approval' ? 'border-l-yellow-500' :
                                                app.status === 'approved' ? 'border-l-green-500' :
                                                app.status === 'rejected' ? 'border-l-red-500' :
                                                'border-l-gray-500'
                                            }`}>
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <h4 className="font-semibold text-lg">{app.display_name}</h4>
                                                                <Badge className={`${
                                                                    app.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                                                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {app.status.replace('_', ' ').toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-sm text-slate-500">SEBI Registration</p>
                                                                    <p className="font-medium">{app.sebi_registration_number}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-slate-500">Application Date</p>
                                                                    <p className="font-medium">{format(new Date(app.created_date), "MMM d, yyyy")}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-slate-500">Followers</p>
                                                                    <p className="font-medium">{app.follower_count || 0}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-slate-500">Success Rate</p>
                                                                    <p className="font-medium">{app.success_rate || 'N/A'}%</p>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-sm text-slate-500">Bio</p>
                                                                <p className="text-sm">{app.bio || 'No bio provided'}</p>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-sm text-slate-500 mb-2">SEBI Documents</p>
                                                                <a 
                                                                    href={app.sebi_document_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="text-blue-600 hover:underline text-sm"
                                                                >
                                                                    📄 View/Download Certificate
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {canManageAdvisors && (
                                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                                {app.status === 'pending_approval' && (
                                                                    <>
                                                                        <Button 
                                                                            size="sm" 
                                                                            className="bg-green-600 hover:bg-green-700 text-white" 
                                                                            onClick={() => handleAdvisorApprove(app.id, app.user_id)}
                                                                        >
                                                                            <Check className="w-4 h-4 mr-1"/>
                                                                            Approve
                                                                        </Button>
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="destructive" 
                                                                            onClick={() => handleAdvisorReject(app.id)}
                                                                        >
                                                                            <X className="w-4 h-4 mr-1"/>
                                                                            Reject
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                
                                                                {app.status === 'approved' && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        className="border-orange-500 text-orange-700 hover:bg-orange-50"
                                                                        onClick={() => handleAdvisorSuspend(app.id)}
                                                                    >
                                                                        Suspend
                                                                    </Button>
                                                                )}

                                                                {app.status === 'suspended' && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                        onClick={() => handleAdvisorReinstate(app.id)}
                                                                    >
                                                                        Reinstate
                                                                                                        </Button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {!canManageAdvisors && (
                                                            <Badge variant="outline" className="text-orange-600">
                                                                View Only
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {selectedTab === 'moderation' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Flagged Content ({moderationLogs.length})</h3>
                                {moderationLogs.length === 0 ? (
                                    <p className="text-slate-500">No pending moderation cases.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {moderationLogs.map(log => (
                                            <Card key={log.id} className="border-l-4 border-l-red-500">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <Badge className={`mb-2 ${
                                                                log.severity === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                                                log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                                'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                            }`}>
                                                                {log.violation_type} - {log.severity}
                                                            </Badge>
                                                            <p className="text-sm text-slate-600 mb-2">
                                                                <strong>Message:</strong> "{log.message_content}"
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                User ID: {log.user_id} • {format(new Date(log.created_date), "MMM d, yyyy h:mm a")}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleModerationAction(log.id, 'dismissed', 'False positive')}
                                                            >
                                                                Dismiss
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleModerationAction(log.id, 'escalated', 'Confirmed violation')}
                                                            >
                                                                Escalate
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {selectedTab === 'inquiries' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Support Inquiries ({contactInquiries.length})</h3>
                                {contactInquiries.length === 0 ? (
                                    <p className="text-slate-500">No pending support inquiries.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {contactInquiries.map(inquiry => (
                                            <Card key={inquiry.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <Badge variant="secondary" className="capitalize">{inquiry.subject.replace(/_/g, ' ')}</Badge>
                                                                <p className="text-sm font-semibold">{inquiry.full_name}</p>
                                                                <a href={`mailto:${inquiry.email}`} className="text-sm text-blue-600 hover:underline">{inquiry.email}</a>
                                                            </div>
                                                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md">{inquiry.message}</p>
                                                            <p className="text-xs text-slate-500 mt-2">
                                                                {format(new Date(inquiry.created_date), "MMM d, yyyy h:mm a")}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <Select value={inquiry.status} onValueChange={(value) => handleInquiryStatusChange(inquiry.id, value)}>
                                                                <SelectTrigger className="w-[180px]">
                                                                    <SelectValue placeholder="Set status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="new">New</SelectItem>
                                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedTab === 'settings' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Platform Settings</h3>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Commission Management</CardTitle>
                                        <CardDescription>Set the platform's commission rate for advisor subscriptions</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <label className="text-sm font-medium">Global Commission Rate (%)</label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g., 20 for 20%" 
                                                    value={commissionRate}
                                                    onChange={(e) => setCommissionRate(e.target.value)}
                                                    disabled={!canEditCommission}
                                                    className="mt-1"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Current: {commissionRate}% to Platform, {100 - parseFloat(commissionRate || 0)}% to Advisor
                                                </p>
                                            </div>
                                            <Button 
                                                onClick={handleCommissionSave} 
                                                disabled={!canEditCommission}
                                                className="mt-6"
                                            >
                                                {canEditCommission ? 'Save Rate' : 'View Only'}
                                            </Button>
                                        </div>
                                        
                                        {!canEditCommission && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                                <p className="text-sm text-yellow-800">
                                                    ⚠️ Only Admins and Super Admins can modify commission rates.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pledge System Control</CardTitle>
                                        <CardDescription>Enable or disable pledges system-wide</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium">Community Pledges</h4>
                                                <p className="text-xs text-slate-500">
                                                    {pledgesEnabled 
                                                        ? "Users can currently make pledges on polls" 
                                                        : "Pledges are disabled - users cannot create new pledges"
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge 
                                                    variant="outline" 
                                                    className={pledgesEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                                >
                                                    {pledgesEnabled ? 'ENABLED' : 'DISABLED'}
                                                </Badge>
                                                <Button 
                                                    onClick={handlePledgeToggle}
                                                    disabled={!canTogglePledges}
                                                    className={pledgesEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                                >
                                                    {pledgesEnabled ? 'Disable Pledges' : 'Enable Pledges'}
                                                </Button>
                                            </div>
                                        </div>

                                        {!canTogglePledges && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                                <p className="text-sm text-yellow-800">
                                                    ⚠️ Only Admins and Super Admins can control pledge settings.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Revenue Overview</CardTitle>
                                        <CardDescription>Summary of platform revenue from advisor subscriptions</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">₹2,45,000</div>
                                                <div className="text-sm text-slate-500">Total Revenue</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">₹49,000</div>
                                                <div className="text-sm text-slate-500">Platform Commission</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">₹1,96,000</div>
                                                <div className="text-sm text-slate-500">Advisor Payouts</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {selectedTab === 'feedback' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">User Feedback ({feedbackItems.length})</h3>
                                {feedbackItems.length === 0 ? (
                                    <p className="text-slate-500">No feedback submissions yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {feedbackItems.map(item => (
                                            <Card key={item.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <p className="text-sm font-semibold">{item.name}</p>
                                                                <a href={`mailto:${item.email}`} className="text-sm text-blue-600 hover:underline">{item.email}</a>
                                                                <Badge variant="outline" className="capitalize">{item.user_role}</Badge>
                                                            </div>
                                                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md">{item.feedback_text}</p>
                                                            <p className="text-xs text-slate-500 mt-2">
                                                                {format(new Date(item.created_date), "MMM d, yyyy h:mm a")}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <Select value={item.status} onValueChange={(value) => handleFeedbackStatusChange(item.id, value)}>
                                                                <SelectTrigger className="w-[200px]">
                                                                    <SelectValue placeholder="Set status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="new">New</SelectItem>
                                                                    <SelectItem value="under_review">Under Review</SelectItem>
                                                                    <SelectItem value="next_phase_consideration">Next Phase Consideration</SelectItem>
                                                                    <SelectItem value="implemented">Implemented</SelectItem>
                                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {searchedUser && selectedTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t pt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    User Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>Display Name:</strong> {searchedUser.display_name}</p>
                                <p><strong>Email:</strong> {searchedUser.email}</p>
                                <p><strong>Current Trust Score:</strong> <span className="font-bold text-xl">{Math.round(searchedUser.trust_score)}</span></p>
                                <p><strong>App Role:</strong> <Badge>{searchedUser.app_role || 'trader'}</Badge></p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Adjust Trust Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleScoreAdjustment} className="space-y-3">
                                    <Input
                                        type="number"
                                        placeholder="Amount (e.g., -10 or 5)"
                                        value={adjustment.amount}
                                        onChange={e => setAdjustment({...adjustment, amount: e.target.value})}
                                    />
                                    <Input
                                        placeholder="Reason for adjustment"
                                        value={adjustment.reason}
                                        onChange={e => setAdjustment({...adjustment, reason: e.target.value})}
                                    />
                                    <Button type="submit" className="w-full">Apply Adjustment</Button>
                                </form>
                            </CardContent>
                        </Card>
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Trust Score History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 max-h-96 overflow-y-auto">
                                    {scoreLogs.length === 0 ? (
                                        <li className="text-slate-500 text-center py-4">No trust score history found for this user.</li>
                                    ) : (
                                        scoreLogs.map(log => (
                                            <li key={log.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    {log.change_amount > 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                                                    <div>
                                                        <p className="font-semibold">{log.reason}</p>
                                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {format(new Date(log.created_date), "MMM d, yyyy h:mm a")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${log.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                                                    </p>
                                                    <p className="text-xs text-slate-500">New Score: {Math.round(log.new_score)}</p>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
