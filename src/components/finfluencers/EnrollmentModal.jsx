import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Clock, 
  Users, 
  Calendar, 
  CreditCard, 
  CheckCircle,
  Award,
  BookOpen,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EnrollmentModal({ open, onClose, course, influencer }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const handleEnrollment = async () => {
    setIsProcessing(true);
    
    try {
      // Get current user
      const currentUser = await base44.auth.me();
      
      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        // Load Razorpay script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Create order on backend (mock for now, you'll need to implement actual backend endpoint)
      const orderData = {
        amount: course.price * 100, // Amount in paise
        currency: 'INR',
        receipt: `course_${course.id}_${Date.now()}`,
        notes: {
          course_id: course.id,
          course_title: course.title,
          user_id: currentUser.id,
          influencer_id: influencer.id
        }
      };

      // Initialize Razorpay payment
      const options = {
        key: 'rzp_test_1234567890', // This should come from PlatformSettings - TEST KEY
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Protocol - Course Enrollment',
        description: course.title,
        image: influencer.profile_image_url,
        handler: async function (response) {
          try {
            // Payment successful
            const enrollmentData = {
              course_id: course.id,
              user_id: currentUser.id,
              payment_id: response.razorpay_payment_id,
              amount_paid: course.price,
              platform_commission: course.price * 0.25, // 25% commission
              influencer_payout: course.price * 0.75,
              enrollment_status: 'active'
            };

            // Create course enrollment record
            await base44.entities.CourseEnrollment.create(enrollmentData);

            // Create revenue transaction record
            await base44.entities.RevenueTransaction.create({
              influencer_id: influencer.id,
              course_id: course.id,
              user_id: currentUser.id,
              gross_amount: course.price,
              platform_commission: course.price * 0.25,
              influencer_payout: course.price * 0.75,
              commission_rate: 25,
              transaction_type: 'course_purchase',
              enrollment_id: enrollmentData.id
            });

            setIsProcessing(false);
            setEnrollmentSuccess(true);
            toast.success('Enrollment successful!');
            
            // Close modal after 2 seconds
            setTimeout(() => {
              setEnrollmentSuccess(false);
              onClose();
            }, 2000);
          } catch (error) {
            console.error('Error creating enrollment:', error);
            toast.error('Enrollment failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: currentUser.display_name || currentUser.full_name,
          email: currentUser.email,
          contact: currentUser.mobile_number || ''
        },
        notes: orderData.notes,
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!course || !influencer) return null;

  if (enrollmentSuccess) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Enrollment Successful!
            </h3>
            <p className="text-slate-600 mb-4">
              You're now enrolled in "{course.title}"
            </p>
            {course.course_type === 'live_session' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  You'll receive meeting details via email before the session starts.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Enroll in Course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-slate-900 mb-2">{course.title}</h3>
            <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
              <img
                src={influencer.profile_image_url}
                alt={influencer.display_name}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{influencer.display_name}</span>
              {influencer.sebi_registered && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  SEBI Registered
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{course.duration_hours} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span className="capitalize">{course.difficulty_level}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{course.current_enrollments} enrolled</span>
              </div>
              {course.course_type === 'live_session' && course.scheduled_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{format(new Date(course.scheduled_date), 'MMM d')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Course Description */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">What You'll Learn</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Curriculum */}
          {course.curriculum && course.curriculum.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Course Curriculum</h4>
              <div className="space-y-2">
                {course.curriculum.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-slate-600">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {course.prerequisites && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Prerequisites
              </h4>
              <p className="text-sm text-amber-700">{course.prerequisites}</p>
            </div>
          )}

          {/* Live Session Info */}
          {course.course_type === 'live_session' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Live Session Details</h4>
              <div className="space-y-2 text-sm text-blue-700">
                {course.scheduled_date && (
                  <p>
                    <strong>Date & Time:</strong> {format(new Date(course.scheduled_date), 'EEEE, MMMM d, yyyy • h:mm a')}
                  </p>
                )}
                <p><strong>Duration:</strong> {course.duration_hours} hours</p>
                <p><strong>Platform:</strong> Zoom (link will be shared via email)</p>
                <p><strong>Recording:</strong> Session will be recorded for enrolled students</p>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-3xl font-bold text-slate-900">
                  ₹{course.price?.toLocaleString('en-IN')}
                </span>
                <p className="text-sm text-slate-500">One-time payment</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Lifetime Access
              </Badge>
            </div>
            
            <div className="text-xs text-slate-600 space-y-1">
              <p>• Includes all course materials</p>
              <p>• Certificate of completion</p>
              <p>• 30-day money-back guarantee</p>
              {course.course_type === 'live_session' && (
                <p>• Session recording for review</p>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </h4>
            <div className="text-sm text-slate-600">
              <p>Secure payment powered by Razorpay</p>
              <p className="text-xs mt-1">Supports UPI, Cards, Net Banking & Wallets</p>
            </div>
          </div>

          {/* Payment Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnrollment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{course.price?.toLocaleString('en-IN')}
                </>
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              <strong>Disclaimer:</strong> All course content is for educational purposes only. 
              Past performance does not guarantee future results. Please consult with qualified 
              financial advisors before making investment decisions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}