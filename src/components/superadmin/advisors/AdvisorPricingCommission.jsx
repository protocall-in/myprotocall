
import React, { useState, useEffect, useCallback } from 'react';
import { Advisor, User, PlatformSetting, CommissionTracking } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, DollarSign, Percent, AlertCircle, TrendingUp, Users, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PayoutTracking = ({ globalMinPayout, commissionData, advisors }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ grossRevenue: 0, platformCommission: 0, netPayout: 0 });

    useEffect(() => {
        const grossRevenue = commissionData.reduce((sum, item) => sum + item.gross_amount, 0);
        const platformCommission = commissionData.reduce((sum, item) => sum + item.platform_fee, 0);
        const netPayout = commissionData.reduce((sum, item) => sum + item.advisor_payout, 0);
        setStats({ grossRevenue, platformCommission, netPayout });
        setIsLoading(false);
    }, [commissionData]);

    const handleExport = () => {
        // Basic CSV export logic
        const headers = ['Transaction Date', 'Advisor Name', 'Gross Amount', 'Platform Fee', 'Net Payout', 'Status'];
        const rows = commissionData.map(item => {
            const advisorName = advisors.find(a => a.id === item.advisor_id)?.display_name || 'Unknown';
            return [
                new Date(item.transaction_date).toLocaleDateString(),
                `"${advisorName}"`,
                item.gross_amount,
                item.platform_fee,
                item.advisor_payout,
                item.payout_status
            ].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "advisor_payout_tracking.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Payout tracking exported as CSV.");
    };

    if (isLoading) return <div>Loading payout data...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/90 text-sm font-medium">Gross Revenue</p>
                                        <p className="text-white text-3xl font-bold">₹{stats.grossRevenue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white">
                            <p className="text-xs text-gray-600">Total revenue generated</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Percent className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/90 text-sm font-medium">Platform Commission</p>
                                        <p className="text-white text-3xl font-bold">₹{stats.platformCommission.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white">
                            <p className="text-xs text-gray-600">Platform earnings</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/90 text-sm font-medium">Net Payout to Advisors</p>
                                        <p className="text-white text-3xl font-bold">₹{stats.netPayout.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white">
                            <p className="text-xs text-gray-600">Total advisor earnings</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Global Minimum Payout Threshold: <span className="font-bold">₹{globalMinPayout}</span></p>
                <Button onClick={handleExport} variant="outline"><Download className="w-4 h-4 mr-2" /> Export to CSV</Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2">Date</th>
                                <th className="text-left py-2">Advisor</th>
                                <th className="text-right py-2">Gross</th>
                                <th className="text-right py-2">Commission</th>
                                <th className="text-right py-2">Payout</th>
                                <th className="text-center py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionData.slice(0, 10).map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2">{new Date(item.transaction_date).toLocaleDateString()}</td>
                                    <td>{advisors.find(a => a.id === item.advisor_id)?.display_name || 'N/A'}</td>
                                    <td className="text-right">₹{item.gross_amount.toFixed(2)}</td>
                                    <td className="text-right text-red-600">₹{item.platform_fee.toFixed(2)}</td>
                                    <td className="text-right text-green-600">₹{item.advisor_payout.toFixed(2)}</td>
                                    <td className="text-center"><span className={`px-2 py-1 text-xs rounded-full ${item.payout_status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.payout_status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

const CommissionSettingsComponent = ({ platformSettings, moduleCommissionRate, onModuleRateChange, advisors, onIndividualRateChange }) => {
    return (
        <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" />Global Settings</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800">
                    <p><strong>Global Commission Rate:</strong> {platformSettings.global_commission_rate || '20'}%</p>
                    <p><strong>Global Minimum Payout:</strong> ₹{platformSettings.global_minimum_payout_threshold || '500'}</p>
                    <p className="text-sm mt-2">Override these settings below for the Advisors module.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-purple-600" />Advisor Module Commission Override</CardTitle>
                    <p className="text-sm text-gray-500">Override global commission rate for all advisors. Leave blank to use global rate ({platformSettings.global_commission_rate || '20'}%).</p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-3 max-w-sm">
                        <div className="flex-grow">
                            <Label htmlFor="module-commission" className="flex items-center gap-1 mb-1"><Percent className="w-4 h-4 text-gray-500" /> Advisor Commission Rate (%)</Label>
                            <Input
                                id="module-commission"
                                type="number"
                                placeholder={platformSettings.global_commission_rate || '20'}
                                value={moduleCommissionRate}
                                onChange={(e) => onModuleRateChange(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-green-600" />Individual Advisor Overrides</CardTitle>
                    <p className="text-sm text-gray-500">Set specific rates for individual advisors. These override both global and module settings.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {advisors.map(advisor => (
                        <div key={advisor.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                            <div>
                                <p className="font-semibold">{advisor.user?.display_name || advisor.display_name}</p>
                                <p className="text-xs text-gray-500">Current: {advisor.commission_override_rate || moduleCommissionRate || platformSettings.global_commission_rate || '20'}%</p>
                            </div>
                            <div className="flex items-center gap-2 w-48">
                                <Input
                                    type="number"
                                    placeholder="Override %"
                                    value={advisor.commission_override_rate || ''}
                                    onChange={(e) => onIndividualRateChange(advisor.id, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default function AdvisorPricingCommission() {
    const [platformSettings, setPlatformSettings] = useState({});
    const [advisors, setAdvisors] = useState([]);
    const [commissionData, setCommissionData] = useState([]);
    const [moduleCommissionRate, setModuleCommissionRate] = useState('');
    const [activeTab, setActiveTab] = useState('settings');
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [settingsData, advisorsData, commissionTrackingData, usersData] = await Promise.all([
                PlatformSetting.list(),
                Advisor.filter({ status: 'approved' }),
                CommissionTracking.list(),
                User.list()
            ]);

            const settingsMap = settingsData.reduce((acc, s) => ({ ...acc, [s.setting_key]: s.setting_value }), {});
            setPlatformSettings(settingsMap);
            setModuleCommissionRate(settingsMap.advisor_module_commission_rate || '');

            const usersMap = new Map(usersData.map(u => [u.id, u]));
            const populatedAdvisors = advisorsData.map(adv => ({
                ...adv,
                user: usersMap.get(adv.user_id),
            }));

            setAdvisors(populatedAdvisors);
            setCommissionData(commissionTrackingData.filter(ct => advisorsData.some(a => a.id === ct.advisor_id)));

        } catch (error) {
            console.error("Failed to load pricing and commission data:", error);
            toast.error("Failed to load data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSaveSettings = async () => {
        try {
            // Save Module Override
            const moduleRateSetting = await PlatformSetting.filter({ setting_key: 'advisor_module_commission_rate' });
            const payload = { setting_key: 'advisor_module_commission_rate', setting_value: String(moduleCommissionRate) };
            if (moduleRateSetting.length > 0) {
                await PlatformSetting.update(moduleRateSetting[0].id, payload);
            } else {
                await PlatformSetting.create(payload);
            }

            // Save Individual Overrides
            const updatePromises = advisors.map(adv => {
                const rate = adv.commission_override_rate === '' ? null : parseFloat(adv.commission_override_rate);
                return Advisor.update(adv.id, { commission_override_rate: rate });
            });
            await Promise.all(updatePromises);
            
            toast.success("Commission settings saved successfully!");
            loadData(); // Reload to reflect changes
        } catch (error) {
            console.error("Error saving commission settings:", error);
            toast.error("Failed to save settings.");
        }
    };

    const handleIndividualRateChange = (advisorId, value) => {
        setAdvisors(prev => prev.map(adv => adv.id === advisorId ? { ...adv, commission_override_rate: value } : adv));
    };

    if (isLoading) return <div>Loading Commission Settings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save All Changes</Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-transparent p-1 rounded-xl gap-2">
                    <TabsTrigger 
                        value="settings"
                        className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                        Commission Settings
                    </TabsTrigger>
                    <TabsTrigger 
                        value="payouts"
                        className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                        Payout Tracking
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="settings" className="mt-6">
                    <CommissionSettingsComponent
                        platformSettings={platformSettings}
                        moduleCommissionRate={moduleCommissionRate}
                        onModuleRateChange={setModuleCommissionRate}
                        advisors={advisors}
                        onIndividualRateChange={handleIndividualRateChange}
                    />
                </TabsContent>
                <TabsContent value="payouts" className="mt-6">
                    <PayoutTracking
                        globalMinPayout={platformSettings.global_minimum_payout_threshold || '500'}
                        commissionData={commissionData}
                        advisors={advisors}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
