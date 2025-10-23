import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewSection({ reviews }) {
    if (reviews.length === 0) {
        return (
            <Card className="rounded-xl">
                <CardContent className="p-8 text-center">
                    <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-slate-700">No Reviews Yet</h3>
                    <p className="text-slate-500">Be the first to review this advisor!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map(review => (
                <Card key={review.id} className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                    V
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">Verified User</p>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${
                                                    star <= review.rating
                                                        ? 'text-yellow-500 fill-current'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500">
                                {format(new Date(review.created_date), 'MMM d, yyyy')}
                            </span>
                        </div>
                        
                        {review.review && (
                            <p className="text-slate-700 leading-relaxed">{review.review}</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}