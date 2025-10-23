import React from 'react';
import FeedbackForm from '../components/feedback/FeedbackForm';
import { MessageCircle } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-purple-100 text-purple-600 rounded-full p-4 mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Share Your Feedback
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
            Your insights help us improve Protocol. Let us know what's on your mind.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
            <FeedbackForm />
        </div>
      </div>
    </div>
  );
}