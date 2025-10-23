
import React, { useState, useEffect } from "react";
import { News, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Sample news data (moved outside component to avoid dependency issues)
const sampleNews = [
  {
    id: '1',
    title: 'RBI Monetary Policy: Repo Rate Unchanged at 6.5%',
    summary: 'Reserve Bank of India maintains status quo on key policy rates, focuses on inflation control',
    category: 'regulation',
    source: 'Economic Times',
    stock_impact: ['HDFCBANK', 'ICICIBANK', 'AXISBANK'],
    sentiment: 'neutral',
    image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    is_breaking: false,
    created_date: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Reliance Industries Reports Strong Q3 Results',
    summary: 'RIL beats estimates with 25% jump in net profit, driven by strong petrochemicals performance',
    category: 'earnings',
    source: 'Moneycontrol',
    stock_impact: ['RELIANCE'],
    sentiment: 'positive',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
    is_breaking: true,
    created_date: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    title: 'IT Sector Faces Headwinds Amid Global Slowdown',
    summary: 'Major IT companies revise FY24 guidance downward as client spending remains cautious',
    category: 'sector',
    source: 'Business Standard',
    stock_impact: ['TCS', 'INFY', 'WIPRO', 'HCLTECH'],
    sentiment: 'negative',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    is_breaking: false,
    created_date: '2024-01-15T08:45:00Z'
  },
  {
    id: '4',
    title: 'Foreign Investors Turn Net Buyers After 3 Months',
    summary: 'FIIs invest ₹2,847 crore in Indian equities in first two weeks of January',
    category: 'market',
    source: 'Mint',
    stock_impact: [],
    sentiment: 'positive',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
    is_breaking: false,
    created_date: '2024-01-15T07:30:00Z'
  }
];

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const loadNews = async () => {
      try {
        const fetchedNews = await News.list('-created_date', 50);
        setNews(fetchedNews.length > 0 ? fetchedNews : sampleNews);
      } catch (error) {
        console.error("Error loading news:", error);
        setNews(sampleNews);
      } finally {
        setIsLoading(false);
      }
    };
    loadNews();
  }, []); // Empty dependency array, as sampleNews is now a constant outside the component

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'earnings': return 'bg-blue-100 text-blue-800';
      case 'regulation': return 'bg-purple-100 text-purple-800';
      case 'sector': return 'bg-orange-100 text-orange-800';
      case 'market': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Newspaper className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Market News
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Stay updated with the latest market news, earnings, and regulatory updates
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-2xl mx-auto">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar-input w-full"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Categories</option>
            <option value="market">Market</option>
            <option value="earnings">Earnings</option>
            <option value="regulation">Regulation</option>
            <option value="sector">Sector</option>
          </select>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map(article => (
            <Card key={article.id} className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden border-0 bg-white">
              <div className="relative">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                {article.is_breaking && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                    BREAKING
                  </Badge>
                )}
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2">{article.title}</h3>
                  {getSentimentIcon(article.sentiment)}
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{article.summary}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(article.category)}`}>
                    {article.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                    {article.sentiment}
                  </Badge>
                </div>

                {article.stock_impact && article.stock_impact.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.stock_impact.slice(0, 3).map(stock => (
                      <Badge key={stock} variant="outline" className="text-xs">
                        {stock}
                      </Badge>
                    ))}
                    {article.stock_impact.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.stock_impact.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">{article.source}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>2h ago</span> {/* This should ideally calculate time difference from created_date */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No news found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
