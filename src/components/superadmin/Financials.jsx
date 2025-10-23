import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RevenueTransaction,
  Subscription,
  Expense,
  FinancialAuditLog,
  User,
  FinInfluencer,
  Advisor,
  CommissionTracking,
  CourseEnrollment,
  SubscriptionTransaction,
  SubscriptionPlan,
  PromoCode,
  PayoutRequest,
  CampaignBilling,
  RefundRequest // ADDED: Import RefundRequest
} from '@/api/entities';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Receipt, FileText, ShieldCheck, HandCoins, BarChart3, CreditCard, TrendingUp, Percent, RotateCcw } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';

import Overview from './financials/Overview';
import ExpenseManager from './financials/ExpenseManager';
import Reports from './financials/Reports';
import AuditLog from './financials/AuditLog';
import Payouts from './financials/Payouts';
import SubscriptionRevenue from './financials/SubscriptionRevenue';
import CommissionAnalytics from './financials/CommissionAnalytics';
import RefundAnalytics from './financials/RefundAnalytics'; // ADDED: New component

const tabs = [
  { id: 'overview', name: 'Overview', icon: BarChart3, gradient: 'from-blue-500 to-blue-600' },
  { id: 'commission-analytics', name: 'Commission Analytics', icon: Percent, gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'subscription', name: 'Subscription Revenue', icon: CreditCard, gradient: 'from-green-500 to-green-600' },
  { id: 'refunds', name: 'Refunds', icon: RotateCcw, gradient: 'from-orange-500 to-orange-600' }, // ADDED: Refunds tab
  { id: 'payouts', name: 'Payouts', icon: HandCoins, gradient: 'from-purple-500 to-purple-600' },
  { id: 'expenses', name: 'Expenses', icon: Receipt, gradient: 'from-orange-500 to-orange-600' },
  { id: 'reports', name: 'Reports', icon: FileText, gradient: 'from-teal-500 to-teal-600' },
  { id: 'audit', name: 'Audit Log', icon: ShieldCheck, gradient: 'from-red-500 to-red-600' }
];

export default function Financials() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [revenueData, setRevenueData] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [subscriptionTransactions, setSubscriptionTransactions] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [finfluencers, setFinfluencers] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [adTransactions, setAdTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]); // ADDED: Refunds state

  const { settings: platformSettings } = usePlatformSettings();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        revData, subData, subTransData, subPlansData, promoData, expData, audData, userData,
        finfluencerData, advisorData, commData, enrollData, payoutRequestsData, campaignBillingData,
        refundData // ADDED: Load refunds
      ] = await Promise.all([
        RevenueTransaction.list(),
        Subscription.list(),
        SubscriptionTransaction.list().catch(() => []),
        SubscriptionPlan.list().catch(() => []),
        PromoCode.list().catch(() => []),
        Expense.list(),
        FinancialAuditLog.list(),
        User.me(),
        FinInfluencer.list(),
        Advisor.list(),
        CommissionTracking.list(),
        CourseEnrollment.list(),
        PayoutRequest.list().catch(() => []),
        CampaignBilling.list().catch(() => []),
        RefundRequest.list().catch(() => []) // ADDED: Load refunds
      ]);

      console.log('Loaded payout requests:', payoutRequestsData);
      console.log('Loaded Campaign Billing Records:', campaignBillingData);
      console.log('Loaded Refunds:', refundData); // ADDED: Debug log

      // Get all user IDs from finfluencers and advisors
      const userIds = [
        ...finfluencerData.map((f) => f.user_id),
        ...advisorData.map((a) => a.user_id)
      ].filter(Boolean);

      const validObjectIdRegex = /^[0-9a-fA-F]{24}$/;
      const validUserIds = userIds.filter((id) => validObjectIdRegex.test(id));

      console.log(`Found ${userIds.length} total user IDs, ${validUserIds.length} valid ObjectIds`);
      if (userIds.length > validUserIds.length) {
        console.warn('Some user IDs were invalid ObjectIds and will be skipped:',
          userIds.filter((id) => !validObjectIdRegex.test(id))
        );
      }

      let users = [];
      if (validUserIds.length > 0) {
        const uniqueValidUserIds = [...new Set(validUserIds)];
        users = await User.filter({ id: { '$in': uniqueValidUserIds } }).catch((error) => {
          console.error('Error loading users:', error);
          return [];
        });
      }

      const usersMap = new Map(users.map((u) => [u.id, u]));

      const enrichedFinfluencers = finfluencerData.map((f) => ({
        ...f,
        user: usersMap.get(f.user_id),
        profile_image_url: f.profile_image_url || usersMap.get(f.user_id)?.profile_image_url,
        email: usersMap.get(f.user_id)?.email,
        display_name: f.display_name || usersMap.get(f.user_id)?.display_name || `Finfluencer ${f.id?.slice(-6) || 'Unknown'}`
      }));

      const enrichedAdvisors = advisorData.map((a) => ({
        ...a,
        user: usersMap.get(a.user_id),
        profile_image_url: a.profile_image_url || usersMap.get(a.user_id)?.profile_image_url,
        email: usersMap.get(a.user_id)?.email,
        display_name: a.display_name || usersMap.get(a.user_id)?.display_name || `Advisor ${a.id?.slice(-6) || 'Unknown'}`
      }));

      setRevenueData(revData);
      setSubscriptionData(subData);
      setSubscriptionTransactions(subTransData);
      setSubscriptionPlans(subPlansData);
      setPromoCodes(promoData);
      setExpenses(expData);
      setAuditLogs(audData);
      setCurrentUser(userData);
      setFinfluencers(enrichedFinfluencers);
      setAdvisors(enrichedAdvisors);
      setCommissions(commData);
      setEnrollments(enrollData);
      setPayoutRequests(payoutRequestsData);
      setAdTransactions(campaignBillingData);
      setRefunds(refundData); // ADDED: Set refunds
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast.error("Failed to load financial data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const permissions = useMemo(() => ({
    isSuperAdmin: currentUser?.app_role === 'super_admin',
    isAdmin: currentUser?.app_role === 'admin',
    isFinanceSubAdmin: currentUser?.app_role === 'finance_sub_admin',
    canViewAll: ['super_admin', 'admin', 'finance_sub_admin'].includes(currentUser?.app_role),
    canEdit: ['super_admin', 'admin'].includes(currentUser?.app_role),
    canViewFinancials: ['super_admin', 'admin', 'finance_sub_admin'].includes(currentUser?.app_role),
    canManageExpenses: ['super_admin', 'admin', 'finance_sub_admin'].includes(currentUser?.app_role)
  }), [currentUser]);

  const processedData = useMemo(() => {
    // Combine all revenue sources including subscription transactions and ad transactions
    const allRevenue = [
      ...revenueData.map((r) => ({ ...r, date: r.created_date, source: 'Course Sales' })),
      ...subscriptionData.map((s) => ({ gross_amount: s.price, platform_commission: s.price * (platformSettings.commissionRate / 100), date: s.created_date, source: 'Platform Subscription' })),
      ...commissions.map((c) => ({ ...c, date: c.transaction_date, source: 'Advisor Subscription' })),
      ...subscriptionTransactions.map((st) => ({
        ...st,
        gross_amount: st.gross_amount,
        platform_commission: st.net_amount,
        date: st.created_date,
        source: `${st.plan_name} Subscription`,
        promo_used: st.promo_code,
        discount_applied: st.discount_amount
      })),
      ...adTransactions.map((ad) => ({
        gross_amount: ad.amount,
        platform_commission: ad.amount,
        date: ad.created_date,
        source: 'Ad Revenue'
      }))
    ];

    // ADDED: Calculate refund totals
    const processedRefunds = refunds.filter(r => r.status === 'processed');
    const totalRefunded = processedRefunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

    const monthlyData = {};
    allRevenue.forEach((tx) => {
      if (!tx.date) return;
      const date = new Date(tx.date);
      const month = format(date, 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, expenses: 0, discounts: 0, refunds: 0 }; // ADDED: refunds
      }
      monthlyData[month].revenue += tx.platform_commission || tx.platform_fee || 0;
      monthlyData[month].discounts += tx.discount_applied || 0;
    });

    expenses.forEach((exp) => {
      const date = new Date(exp.expense_date);
      const month = format(date, 'MMM yyyy');
      if (monthlyData[month]) {
        monthlyData[month].expenses += exp.amount;
      } else {
        monthlyData[month] = { month, revenue: 0, expenses: exp.amount, discounts: 0, refunds: 0 };
      }
    });

    // ADDED: Add refunds to monthly data
    processedRefunds.forEach((refund) => {
      const date = new Date(refund.created_date);
      const month = format(date, 'MMM yyyy');
      if (monthlyData[month]) {
        monthlyData[month].refunds += refund.refund_amount || 0;
      } else {
        monthlyData[month] = { month, revenue: 0, expenses: 0, discounts: 0, refunds: refund.refund_amount || 0 };
      }
    });

    const revenueTrend = Object.values(monthlyData).map((m) => ({
      ...m,
      netRevenue: m.revenue - m.discounts - m.refunds, // ADDED: Subtract refunds
      profit: m.revenue - m.discounts - m.refunds - m.expenses // ADDED: Subtract refunds
    })).sort((a, b) => {
      const dateA = new Date(a.month.split(' ')[1], 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(a.month.split(' ')[0]) / 3);
      const dateB = new Date(b.month.split(' ')[1], 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(b.month.split(' ')[0]) / 3);
      return dateA - dateB;
    });

    const expenseBreakdown = expenses.reduce((acc, exp) => {
      const existing = acc.find((item) => item.name === exp.category);
      if (existing) {
        existing.value += exp.amount;
      } else {
        acc.push({ name: exp.category, value: exp.amount });
      }
      return acc;
    }, []);

    const grossRevenue = allRevenue.reduce((sum, tx) => sum + (tx.gross_amount || 0), 0);
    const totalDiscounts = allRevenue.reduce((sum, tx) => sum + (tx.discount_applied || 0), 0);
    const netRevenue = allRevenue.reduce((sum, tx) => sum + (tx.platform_commission || tx.platform_fee || 0), 0) - totalDiscounts - totalRefunded; // ADDED: Subtract refunds
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const adRevenue = adTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const payoutData = {};
    [...finfluencers, ...advisors].forEach((p) => {
      payoutData[p.user_id] = { gross: 0, commission: 0, net: 0, pending: 0 };
    });

    enrollments.forEach((e) => {
      if (payoutData[e.influencer_id]) {
        payoutData[e.influencer_id].gross += e.amount_paid;
        payoutData[e.influencer_id].commission += e.platform_commission;
        payoutData[e.influencer_id].net += e.influencer_payout;
        if (e.payout_status !== 'processed') {
          payoutData[e.influencer_id].pending += e.influencer_payout;
        }
      }
    });
    commissions.forEach((c) => {
      if (payoutData[c.advisor_id]) {
        payoutData[c.advisor_id].gross += c.gross_amount;
        payoutData[c.advisor_id].commission += c.platform_fee;
        payoutData[c.advisor_id].net += c.advisor_payout;
        if (c.payout_status !== 'processed') {
          payoutData[c.advisor_id].pending += c.advisor_payout;
        }
      }
    });

    return {
      revenueTrend,
      expenseBreakdown,
      payoutData,
      stats: {
        grossRevenue,
        totalDiscounts,
        netRevenue,
        totalExpenses,
        netProfit: netRevenue - totalExpenses,
        adRevenue,
        totalRefunded // ADDED: Total refunds
      }
    };
  }, [revenueData, subscriptionData, subscriptionTransactions, adTransactions, expenses, commissions, enrollments, platformSettings.commissionRate, finfluencers, advisors, refunds]); // ADDED: refunds dependency

  const handleSaveExpense = async (expenseData, adminUser) => {
    if (!permissions.canManageExpenses) {
      toast.error("You don't have permission to perform this action.");
      return;
    }
    try {
      const action = expenseData.id ? 'UPDATE_EXPENSE' : 'CREATE_EXPENSE';
      const payload = {
        ...expenseData,
        added_by_admin_id: adminUser.id,
        added_by_admin_name: adminUser.display_name
      };

      const savedExpense = expenseData.id ?
        await Expense.update(expenseData.id, payload) :
        await Expense.create(payload);

      await FinancialAuditLog.create({
        admin_id: adminUser.id,
        admin_name: adminUser.display_name,
        action,
        entity_type: 'Expense',
        entity_id: savedExpense.id,
        details: `${action === 'UPDATE_EXPENSE' ? 'Updated' : 'Added'} expense "${savedExpense.description}" for ₹${savedExpense.amount.toLocaleString()}`
      });

      toast.success(`Expense ${action === 'UPDATE_EXPENSE' ? 'updated' : 'added'} successfully.`);
      loadData();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense.");
    }
  };

  const handleDeleteExpense = async (expenseId, adminUser) => {
    if (!permissions.canEdit) {
      toast.error("You don't have permission to perform this action.");
      return;
    }
    try {
      const expenseToDelete = expenses.find((e) => e.id === expenseId);
      await Expense.delete(expenseId);
      await FinancialAuditLog.create({
        admin_id: adminUser.id,
        admin_name: adminUser.display_name,
        action: 'DELETE_EXPENSE',
        entity_type: 'Expense',
        entity_id: expenseId,
        details: `Deleted expense "${expenseToDelete.description}" of ₹${expenseToDelete.amount.toLocaleString()}`
      });
      toast.success("Expense deleted successfully.");
      loadData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense.");
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="text-center p-12">Loading advanced financial dashboard...</div>;
    if (!permissions.canViewFinancials) return <div className="text-center p-12">You do not have permission to view this page.</div>;

    switch (activeTab) {
      case 'overview':
        return <Overview data={processedData} subscriptionTransactions={subscriptionTransactions} refunds={refunds} />; // ADDED: Pass refunds
      case 'commission-analytics':
        return <CommissionAnalytics
          finfluencers={finfluencers}
          advisors={advisors}
          permissions={permissions}
          enrollments={enrollments}
          commissions={commissions}
        />;
      case 'subscription':
        return <SubscriptionRevenue
          subscriptionTransactions={subscriptionTransactions}
          subscriptionPlans={subscriptionPlans}
          promoCodes={promoCodes}
          permissions={permissions}
        />;
      case 'refunds': // ADDED: Refunds tab
        return <RefundAnalytics refunds={refunds} permissions={permissions} />;
      case 'payouts':
        return <Payouts
          finfluencers={finfluencers}
          advisors={advisors}
          payoutData={processedData.payoutData}
          permissions={permissions}
          enrollments={enrollments}
          commissions={commissions}
          payoutRequests={payoutRequests}
          onUpdate={loadData}
        />;
      case 'expenses':
        return <ExpenseManager
          expenses={expenses}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          currentUser={currentUser}
          canEdit={permissions.canEdit}
          canManage={permissions.canManageExpenses}
        />;
      case 'reports':
        return <Reports
          revenueData={[...revenueData, ...commissions]}
          subscriptionTransactions={subscriptionTransactions}
          expensesData={expenses}
        />;
      case 'audit':
        return permissions.isSuperAdmin ? <AuditLog logs={auditLogs} /> :
          <div className="text-center p-12">You must be a Super Admin to view the audit log.</div>;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Financial Management Suite
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Complete financial oversight with subscription analytics and promo tracking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time Data</span>
            </div>
          </div>

          <div className="border-b mt-6"></div>

          <div className="flex items-center gap-2 mt-4 p-1 bg-transparent rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
                  variant="ghost"
                  style={isActive ? {
                    background: 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  } : {}}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-700'}`} />
                  <span className="text-sm">{tab.name}</span>
                </Button>
              );
            })}
          </div>
        </CardHeader>
      </Card>

      {renderContent()}
    </div>
  );
}