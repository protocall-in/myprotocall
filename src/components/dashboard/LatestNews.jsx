
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LatestNews() {
  // Sample news data
  const sampleNews = [
    {
      id: '1',
      title: 'RBI Monetary Policy: Repo Rate Unchanged at 6.5%',
      summary: 'Reserve Bank of India maintains status quo on key policy rates, focuses on inflation control',
      category: 'regulation',
      source: 'Economic Times',
      stock_impact: ['HDFCBANK', 'ICICIBANK', 'AXISBANK'],
      sentiment: 'neutral',
      image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop',
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
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
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
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
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
      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=200&fit=crop',
      is_breaking: false,
      created_date: '2024-01-15T07:30:00Z'
    }
  ];

  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'negative': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-slate-500" />;
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

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Newspaper className="w-5 h-5 text-blue-600" />
          Latest Market News
        </CardTitle>
        <p className="text-sm text-slate-600">Stay updated with breaking market news and analysis</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sampleNews.map(news => (
            <div key={news.id} className="flex gap-4 p-3 rounded-xl border bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-200 cursor-pointer">
              {/* Image */}
              <div className="flex-shrink-0">
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="w-20 h-16 rounded-lg object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    {news.is_breaking && (
                      <Badge className="bg-red-500 text-white text-xs mb-1">
                        BREAKING
                      </Badge>
                    )}
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{news.title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {getSentimentIcon(news.sentiment)}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{news.summary}</p>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(news.category)}`}>
                    {news.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getSentimentColor(news.sentiment)}`}>
                    {news.sentiment}
                  </Badge>
                  {news.stock_impact.length > 0 && (
                    <div className="flex gap-1">
                      {news.stock_impact.slice(0, 2).map(stock => (
                        <Badge key={stock} variant="outline" className="text-xs">
                          {stock}
                        </Badge>
                      ))}
                      {news.stock_impact.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{news.stock_impact.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">{news.source}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>2h ago</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link to={createPageUrl("News")}>
            <Button className="btn-primary">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All News
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
