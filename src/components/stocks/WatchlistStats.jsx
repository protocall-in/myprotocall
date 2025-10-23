import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Activity, MessageSquare, BarChart3, Bell, List, LayoutGrid } from "lucide-react";

// Custom Rupee Symbol Component
const RupeeIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 3h12M6 8h12m-12 5h12M8 21l8-8" />
    <path d="M6 8c0-2 2-3 4-3s4 1 4 3-2 3-4 3H6" />
  </svg>
);

export default function WatchlistStats({ watchlist = [], onRemove, onSetAlert, totalValue = 0, totalChange = 0 }) {
  const [view, setView] = useState("grid");
  
  const gainers = watchlist.filter(s => (s.change_percent || 0) > 0).length;
  const losers = watchlist.filter(s => (s.change_percent || 0) < 0).length;
  const totalChangePercent = watchlist.length > 0 && totalValue > 0 ? (totalChange / totalValue) * 100 : 0;
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Stocks</p>
                <p className="text-xl font-bold">{watchlist.length}</p>
              </div>
              <RupeeIcon className="w-6 h-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${totalChangePercent >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${totalChangePercent >= 0 ? 'text-green-100' : 'text-red-100'} text-sm`}>Avg Change</p>
                <p className="text-xl font-bold">{totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%</p>
              </div>
              {totalChangePercent >= 0 ? 
                <TrendingUp className="w-6 h-6 text-green-200" /> : 
                <TrendingDown className="w-6 h-6 text-red-200" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Gainers</p>
                <p className="text-xl font-bold">{gainers}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Losers</p>
                <p className="text-xl font-bold">{losers}</p>
              </div>
              <TrendingDown className="w-6 h-6 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Watchlist Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Watchlist</CardTitle>
          <div className="flex space-x-2">
            <Button
              onClick={() => setView("grid")}
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setView("list")}
              variant={view === 'list' ? 'default' : 'outline'}
              size="icon"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {watchlist.length > 0 ? (
            <>
              {/* Grid View */}
              {view === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlist.map((stock, index) => (
                    <Card key={stock.id || index} className="bg-white border hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{stock.symbol || 'Unknown'}</h4>
                            <p className="text-sm text-gray-500 truncate">{stock.company_name || stock.stock_name || 'Company Name'}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{stock.sector || 'N/A'}</Badge>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-2xl font-bold">₹{(stock.current_price || 0).toFixed(2)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {(stock.change_percent || 0) >= 0 ? (
                              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +{(stock.change_percent || 0).toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded flex items-center">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                {(stock.change_percent || 0).toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="flex-1">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Poll
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => onSetAlert && onSetAlert(stock)}
                          >
                            <Bell className="w-3 h-3 mr-1" />
                            Alert
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* List View */}
              {view === "list" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3 text-right">Price</th>
                        <th className="px-6 py-3 text-right">Change</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {watchlist.map((stock, index) => (
                        <tr key={stock.id || index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{stock.symbol || 'Unknown'}</div>
                            <div className="text-xs text-slate-500 truncate">{stock.company_name || stock.stock_name || 'Company Name'}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">₹{(stock.current_price || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant="outline" className={`${(stock.change_percent || 0) >= 0 ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                              {(stock.change_percent || 0) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              {(stock.change_percent || 0) >= 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <Button size="sm" variant="outline">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Chat
                              </Button>
                              <Button size="sm" variant="outline">
                                <BarChart3 className="w-3 h-3 mr-1" />
                                Poll
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onSetAlert && onSetAlert(stock)}
                              >
                                <Bell className="w-3 h-3 mr-1" />
                                Alert
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Your watchlist is empty</p>
              <p className="text-sm text-gray-500 mt-2">Add stocks to track their performance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}