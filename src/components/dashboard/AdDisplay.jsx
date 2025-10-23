import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdCampaign, AdImpression, AdClick, User } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Global cache to prevent multiple components from fetching simultaneously
const adCache = {
  data: null,
  timestamp: null,
  ttl: 60000, // 1 minute cache
};

export default function AdDisplay({ 
  placement = 'dashboard', 
  userContext = null,
  className = "" 
}) {
    const [activeAd, setActiveAd] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    const fetchAttemptedRef = useRef(false);
    const componentIdRef = useRef(Math.random().toString(36).substring(7));

    // Load current user for targeting
    useEffect(() => {
        let mounted = true;
        
        const loadUser = async () => {
            try {
                const user = await User.me();
                if (mounted) {
                    setCurrentUser(user);
                }
            } catch (error) {
                if (mounted && !error.message?.includes('aborted')) {
                    console.warn("Could not load user for ad targeting:", error);
                }
            }
        };
        
        loadUser();
        
        return () => {
            mounted = false;
        };
    }, []);

    const fetchAd = useCallback(async () => {
        if (!isMounted || fetchAttemptedRef.current) return;
        
        // Mark as attempted to prevent multiple fetches
        fetchAttemptedRef.current = true;
        
        // Check cache first
        const now = Date.now();
        if (adCache.data && adCache.timestamp && (now - adCache.timestamp < adCache.ttl)) {
            console.log(`[AdDisplay-${componentIdRef.current}] Using cached ad data`);
            const cachedAds = adCache.data;
            
            // Filter and select from cache
            const targetedAds = filterAdsByPlacementAndTarget(cachedAds);
            if (targetedAds.length > 0) {
                const randomIndex = Math.floor(Math.random() * targetedAds.length);
                const ad = targetedAds[randomIndex];
                setActiveAd(ad);
                
                // Log impression asynchronously
                logImpression(ad);
            } else {
                setActiveAd(null);
            }
            
            setIsLoading(false);
            return;
        }
        
        // Add exponential delay before fetching (3-7 seconds based on component ID)
        const baseDelay = 3000;
        const randomDelay = Math.random() * 4000; // 0-4 seconds
        await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
        
        if (!isMounted) return;
        
        try {
            setError(false);
            
            console.log(`[AdDisplay-${componentIdRef.current}] Fetching ad campaigns...`);
            
            // Fetch with error handling
            let activeCampaigns = [];
            try {
                activeCampaigns = await AdCampaign.filter({ 
                    status: 'active',
                    placement_locations: { '$in': [placement] }
                });
                
                // Update cache
                adCache.data = activeCampaigns;
                adCache.timestamp = Date.now();
                
            } catch (fetchError) {
                // Handle rate limit specifically
                if (fetchError.message?.includes('Rate limit')) {
                    console.warn(`[AdDisplay-${componentIdRef.current}] Rate limit hit, skipping ad fetch`);
                    setError(true);
                    setIsLoading(false);
                    return;
                }
                
                if (fetchError.message?.includes('aborted') || fetchError.message?.includes('Request aborted')) {
                    console.log(`[AdDisplay-${componentIdRef.current}] Fetch aborted`);
                    setIsLoading(false);
                    return;
                }
                
                throw fetchError;
            }
            
            if (!isMounted) return;
            
            if (activeCampaigns.length === 0) {
                setActiveAd(null);
                setIsLoading(false);
                return;
            }

            const targetedAds = filterAdsByPlacementAndTarget(activeCampaigns);
            
            if (!isMounted) return;

            if (targetedAds.length > 0) {
                const randomIndex = Math.floor(Math.random() * targetedAds.length);
                const ad = targetedAds[randomIndex];
                setActiveAd(ad);
                
                // Log impression asynchronously
                logImpression(ad);
            } else {
                setActiveAd(null);
            }
        } catch (err) {
            if (!isMounted) return;
            
            if (err?.message?.includes('Rate limit') || 
                err?.message?.includes('429') || 
                err?.message?.includes('aborted') ||
                err?.message?.includes('Request aborted')) {
                console.log(`[AdDisplay-${componentIdRef.current}] Ad fetch skipped:`, err.message);
                setError(true);
            } else {
                console.error(`[AdDisplay-${componentIdRef.current}] Error fetching ad:`, err);
                setError(true);
            }
            setActiveAd(null);
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    }, [placement, currentUser, userContext, isMounted]);

    const filterAdsByPlacementAndTarget = (campaigns) => {
        return campaigns.filter(campaign => {
            // Check budget constraints for CPC campaigns
            if (campaign.billing_model === 'cpc') {
                if (campaign.total_budget && campaign.revenue_generated >= campaign.total_budget) {
                    return false;
                }
                
                if (campaign.daily_budget) {
                    const today = new Date().toISOString().split('T')[0];
                    const lastReset = campaign.last_daily_reset;
                    
                    if (lastReset !== today) {
                        // Silently attempt reset (fire and forget)
                        AdCampaign.update(campaign.id, {
                            spent_today: 0,
                            last_daily_reset: today
                        }).catch(() => {});
                        campaign.spent_today = 0;
                    }
                    
                    if (campaign.spent_today >= campaign.daily_budget) {
                        return false;
                    }
                }
            }

            // Apply sector targeting
            if (campaign.target_sectors && campaign.target_sectors.length > 0) {
                const userSectors = currentUser?.favorite_sectors || [];
                const contextSectors = userContext?.sectors || [];
                const allUserSectors = [...userSectors, ...contextSectors];
                
                const hasMatch = campaign.target_sectors.some(targetSector => 
                    allUserSectors.includes(targetSector)
                );
                
                if (!hasMatch) return false;
            }

            // Apply stock targeting
            if (campaign.target_stocks && campaign.target_stocks.length > 0) {
                const contextStock = userContext?.stock_symbol;
                if (!contextStock || !campaign.target_stocks.includes(contextStock)) {
                    return false;
                }
            }

            return true;
        });
    };

    const logImpression = async (ad) => {
        if (!isMounted) return;
        
        // Fire and forget - don't block rendering
        Promise.all([
            AdImpression.create({
                campaign_id: ad.id,
                user_id: currentUser?.id || null
            }).catch(() => {}),
            AdCampaign.update(ad.id, {
                impressions: (ad.impressions || 0) + 1
            }).catch(() => {})
        ]).catch(() => {});
    };

    useEffect(() => {
        setIsMounted(true);
        
        if (placement) {
            fetchAd();
        }
        
        return () => {
            setIsMounted(false);
        };
    }, [fetchAd, placement]);

    const handleAdClick = async () => {
        if (!activeAd) return;

        try {
            const clickCost = activeAd.billing_model === 'cpc' ? (activeAd.cpc_rate || 0) : 0;
            
            // Fire and forget
            Promise.all([
                AdClick.create({
                    campaign_id: activeAd.id,
                    user_id: currentUser?.id || null,
                    cost: clickCost
                }).catch(() => {}),
                AdCampaign.update(activeAd.id, {
                    clicks: (activeAd.clicks || 0) + 1,
                    revenue_generated: (activeAd.revenue_generated || 0) + clickCost,
                    ...(activeAd.billing_model === 'cpc' && {
                        spent_today: (activeAd.spent_today || 0) + clickCost
                    })
                }).catch(() => {})
            ]).catch(() => {});

            // Open link immediately
            window.open(activeAd.cta_link, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error("Error tracking ad click:", error);
            window.open(activeAd.cta_link, '_blank', 'noopener,noreferrer');
        }
    };

    // Don't render if error occurred or component unmounted
    if (error || !isMounted) {
        return null;
    }

    // Show loading skeleton
    if (isLoading) {
        return (
            <Card className={`overflow-hidden ${className}`}>
                <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Don't render if no ad available
    if (!activeAd) {
        return null;
    }

    return (
        <Card className={`overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
            <CardContent className="p-0">
                <div className="relative">
                    <img 
                        src={activeAd.creative_url} 
                        alt={activeAd.title}
                        className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                        <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Sponsored
                        </span>
                    </div>
                </div>
                
                <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {activeAd.title}
                    </h3>
                    {activeAd.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {activeAd.description}
                        </p>
                    )}
                    
                    <Button 
                        onClick={handleAdClick}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Learn More
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}