import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

export default function ReviewForm({ onSubmit, existingReview, advisorName }) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [reviewText, setReviewText] = useState(existingReview?.review || '');
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a rating.");
            return;
        }
        onSubmit(rating, reviewText);
    };

    return (
        <Card className="rounded-xl shadow-md">
            <CardHeader>
                <CardTitle className="text-lg">
                    {existingReview ? `Update Your Review for ${advisorName}` : `Leave a Review for ${advisorName}`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Rating *</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${
                                            star <= (hoveredRating || rating)
                                                ? 'text-yellow-500 fill-current'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {rating > 0 ? `You rated ${rating} out of 5 stars` : 'Click to rate'}
                        </p>
                    </div>

                    {/* Review Text */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Review (Optional)</label>
                        <Textarea
                            placeholder="Share your experience with this advisor..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            maxLength={500}
                            className="rounded-xl"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {reviewText.length}/500 characters
                        </p>
                    </div>

                    <Button type="submit" className="w-full">
                        {existingReview ? 'Update Review' : 'Submit Review'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}