
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Stock, Poll } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserX, Sparkles, Send, Download, TrendingUp, BarChart, Activity, UserCheck } from 'lucide-react';
import { format, formatDistanceToNow, subDays, parseISO, isAfter } from 'date-fns';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const UserTable = ({ users, onSendReminder, sendingStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(users.length / usersPerPage);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return users.slice(startIndex, startIndex + usersPerPage);
  }, [users, currentPage]);

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-lg font-medium text-slate-800">All users are active!</h3>
        <p className="mt-1 text-sm text-slate-500">No users found in this inactivity category.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Inactive For</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.display_name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </TableCell>
                <TableCell><Badge variant="outline">{user.app_role}</Badge></TableCell>
                <TableCell>{format(parseISO(user.last_activity_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{formatDistanceToNow(parseISO(user.last_activity_date))} ago</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onSendReminder(user)}
                    disabled={sendingStatus[user.id]}
                  >
                    {sendingStatus[user.id] ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Reminder</>}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
};


export default function InactiveUserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inactiveStats, setInactiveStats] = useState({ mild: 0, moderate: 0, dormant: 0 });
  const [engagementContent, setEngagementContent] = useState({ stock: null, poll: null });
  const [sendingStatus, setSendingStatus] = useState({});

  const now = useMemo(() => new Date(), []);
  const mildThreshold = useMemo(() => subDays(now, 15), [now]);
  const moderateThreshold = useMemo(() => subDays(now, 30), [now]);
  const dormantThreshold = useMemo(() => subDays(now, 60), [now]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [allUsers, trendingStock, activePoll] = await Promise.all([
          User.list('-last_activity_date'),
          Stock.filter({ is_trending: true }, '-last_updated', 1).catch(() => []),
          Poll.filter({ is_active: true }, '-total_votes', 1).catch(() => [])
        ]);

        const enrichedUsers = allUsers.map(u => ({
          ...u,
          last_activity_date: u.last_activity_date || u.last_login_date || u.created_date,
        }));
        setUsers(enrichedUsers);

        setEngagementContent({
          stock: trendingStock[0],
          poll: activePoll[0]
        });

      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load user and engagement data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadAllData();
  }, []);

  const { mildInactive, moderateInactive, dormantInactive } = useMemo(() => {
    const mild = users.filter(u => isAfter(parseISO(u.last_activity_date), moderateThreshold) && !isAfter(parseISO(u.last_activity_date), mildThreshold));
    const moderate = users.filter(u => isAfter(parseISO(u.last_activity_date), dormantThreshold) && !isAfter(parseISO(u.last_activity_date), moderateThreshold));
    const dormant = users.filter(u => !isAfter(parseISO(u.last_activity_date), dormantThreshold));
    
    setInactiveStats({ mild: mild.length, moderate: moderate.length, dormant: dormant.length });
    
    return { mildInactive: mild, moderateInactive: moderate, dormantInactive: dormant };
  }, [users, mildThreshold, moderateThreshold, dormantThreshold]);

  const handleSendReminder = useCallback(async (user) => {
    setSendingStatus(prev => ({ ...prev, [user.id]: true }));
    try {
      let emailBody = `
        <p>Hi ${user.display_name},</p>
        <p>We've missed you on Protocol! There's a lot of exciting activity you might be interested in.</p>
      `;

      if (engagementContent.stock) {
        emailBody += `
          <p><strong>🔥 Trending Stock:</strong> ${engagementContent.stock.company_name} (${engagementContent.stock.symbol}) is making moves! Join the discussion.</p>
        `;
      }
      if (engagementContent.poll) {
        emailBody += `
          <p><strong>📊 Hot Poll:</strong> Have your say on "${engagementContent.poll.title}" for ${engagementContent.poll.stock_symbol}.</p>
        `;
      }

      emailBody += `
        <p>Come back and see what's new. Your insights are valuable to the community!</p>
        <br/>
        <p>Best,</p>
        <p>The Protocol Team</p>
      `;

      await SendEmail({
        to: user.email,
        subject: "We've missed you on Protocol!",
        body: emailBody
      });

      toast.success(`Re-engagement email sent to ${user.display_name}.`);

    } catch (error) {
      console.error("Error sending re-engagement email:", error);
      toast.error(`Failed to send email to ${user.display_name}.`);
    } finally {
      setSendingStatus(prev => ({ ...prev, [user.id]: false }));
    }
  }, [engagementContent]);
  
  const handleExport = (data, filename) => {
    const csvHeader = "UserID,DisplayName,Email,Role,LastActivity\n";
    const csvRows = data.map(u => 
      `${u.id},${u.display_name},${u.email},${u.app_role},${u.last_activity_date}`
    ).join("\n");
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerClasses = "whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md";

  const stats = useMemo(() => ({
    mild: inactiveStats.mild,
    moderate: inactiveStats.moderate,
    dormant: inactiveStats.dormant,
    reEngaged: 0 // Placeholder, as no logic for this is provided in the outline
  }), [inactiveStats]);


  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-orange-600" />
            Inactive User Engagement
          </CardTitle>
          <p className="text-sm text-slate-600">
            Track, analyze, and re-engage users who have become inactive.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Mildly Inactive (15-30 Days)" value={stats.mild} icon={UserX} color="bg-yellow-500" />
            <StatCard title="Moderately Inactive (30-60 Days)" value={stats.moderate} icon={UserX} color="bg-orange-500" />
            <StatCard title="Dormant (60+ Days)" value={stats.dormant} icon={UserX} color="bg-red-500" />
            <StatCard title="Re-Engaged Users (30d)" value={stats.reEngaged} icon={UserCheck} color="bg-green-500" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mild" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger value="mild" className={triggerClasses}>
            <UserX className="w-4 h-4 mr-2" />
            Mild Inactive ({stats.mild})
          </TabsTrigger>
          <TabsTrigger value="moderate" className={triggerClasses}>
            <UserX className="w-4 h-4 mr-2" />
            Moderate Inactive ({stats.moderate})
          </TabsTrigger>
          <TabsTrigger value="dormant" className={triggerClasses}>
            <UserX className="w-4 h-4 mr-2" />
            Dormant ({stats.dormant})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mild" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><UserX className="w-5 h-5 text-yellow-600" />Mildly Inactive Users (15-30 days)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport(mildInactive, "mildly_inactive_users.csv")}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <UserTable users={mildInactive} onSendReminder={handleSendReminder} sendingStatus={sendingStatus} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="moderate" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><UserX className="w-5 h-5 text-orange-600" />Moderately Inactive Users (30-60 days)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport(moderateInactive, "moderately_inactive_users.csv")}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <UserTable users={moderateInactive} onSendReminder={handleSendReminder} sendingStatus={sendingStatus} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dormant" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><UserX className="w-5 h-5 text-red-600" />Dormant Users (60+ days)</CardTitle>
               <Button variant="outline" size="sm" onClick={() => handleExport(dormantInactive, "dormant_users.csv")}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <UserTable users={dormantInactive} onSendReminder={handleSendReminder} sendingStatus={sendingStatus} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
