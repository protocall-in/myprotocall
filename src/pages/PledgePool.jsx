import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import MyPledgePortfolio from '../components/pledges/MyPledgePortfolio';
import LockedPledgeTab from '../components/pledges/LockedPledgeTab';
import PledgeAccessModal from '../components/pledges/PledgeAccessModal';
import { Loader2, Wallet } from 'lucide-react';
import { PledgeAccessRequest } from '@/api/entities';

export default function PledgePool() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [accessRequest, setAccessRequest] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            if (currentUser && !currentUser.has_pledge_access) {
                const requests = await PledgeAccessRequest.filter({ user_id: currentUser.id }, '-created_date', 1);
                const latestRequest = requests[0] || null;
                setAccessRequest(latestRequest);
                
                // Only show modal automatically on first visit if no request has ever been made
                if (!latestRequest) {
                    setShowAccessModal(true);
                }
            }
        } catch (error) {
            console.warn("Failed to load user data, likely not authenticated:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading Your Pledges...</p>
                </div>
            </div>
        );
    }

    if (!user) {
         return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800">Authentication Required</h2>
                    <p className="text-gray-600 mt-2">Please log in to manage and view your pledges.</p>
                </div>
            </div>
        );
    }
    
    const handleRequestSuccess = (newRequest) => {
        setAccessRequest(newRequest);
        // The modal will show its own success screen, so we don't need to close it immediately.
        // It will be closed by the user.
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Pledge Pool</h1>
                </div>
                <p className="text-gray-600 text-sm ml-11">
                    Coordinate your trading with the community through secure pledge sessions
                </p>
            </div>

            {user?.has_pledge_access ? (
                <MyPledgePortfolio user={user} key={user.id} />
            ) : (
                <div className="relative">
                    <LockedPledgeTab 
                        onOpenModal={() => setShowAccessModal(true)}
                        accessRequest={accessRequest}
                    />
                    <PledgeAccessModal
                        isOpen={showAccessModal}
                        onClose={() => setShowAccessModal(false)}
                        user={user}
                        onSuccess={handleRequestSuccess}
                    />
                </div>
            )}
        </div>
    );
}