import React, { useState, useEffect } from 'react';
import { User, EventOrganizer } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Award, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Star,
  Clock,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function BecomeOrganizerPage() {
  const [user, setUser] = useState(null);
  const [existingOrganizer, setExistingOrganizer] = useState(null);
  const [hasRoleAccess, setHasRoleAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    organization_name: '',
    bio: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    specialization: [],
    linkedin: '',
    twitter: ''
  });

  useEffect(() => {
    loadUserAndOrganizerStatus();
  }, []);

  const loadUserAndOrganizerStatus = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Check role-based access
      const allowedRoles = ['advisor', 'finfluencer', 'educator', 'admin', 'super_admin'];
      const roleAccess = allowedRoles.includes(currentUser.app_role);
      setHasRoleAccess(roleAccess);
      
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        display_name: currentUser.display_name || '',
        contact_email: currentUser.email || ''
      }));

      // Check if user already has an organizer profile
      const organizerProfiles = await EventOrganizer.filter({ user_id: currentUser.id });
      if (organizerProfiles.length > 0) {
        setExistingOrganizer(organizerProfiles[0]);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Please login to continue');
      window.location.href = createPageUrl('Login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.display_name || !formData.bio) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const organizerData = {
        user_id: user.id,
        display_name: formData.display_name,
        organization_name: formData.organization_name,
        bio: formData.bio,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        specialization: formData.specialization.filter(s => s.trim() !== ''),
        social_links: {
          linkedin: formData.linkedin,
          twitter: formData.twitter
        },
        status: 'pending_approval'
      };

      await EventOrganizer.create(organizerData);
      
      toast.success('Application submitted successfully! You\'ll hear from us soon.');
      
      // Reload page to show pending status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpecializationAdd = (value) => {
    if (value && !formData.specialization.includes(value)) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, value]
      }));
    }
  };

  const handleSpecializationRemove = (value) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== value)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show access granted if user has role-based access
  if (hasRoleAccess && !existingOrganizer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You Already Have Organizer Access!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-slate-600">
                As a verified <strong className="text-blue-600 capitalize">{user.app_role}</strong>, you already have full access to create and manage events.
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-semibold mb-2">✅ You can already:</p>
                <ul className="text-sm text-green-700 space-y-1 ml-4 list-disc">
                  <li>Create paid and free events</li>
                  <li>Access the Organizer Dashboard</li>
                  <li>Manage attendees and tickets</li>
                  <li>Handle refund requests</li>
                  <li>Request payouts (80% revenue share)</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can optionally create an EventOrganizer profile below for additional customization, but it's not required to organize events.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.href = createPageUrl('OrganizerDashboard')} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Go to Organizer Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = createPageUrl('Events')} 
                  className="flex-1"
                >
                  Create New Event
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-slate-600 mb-3">Want a customized organizer profile?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHasRoleAccess(false)}
                >
                  Continue with Application Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show status if user already applied
  if (existingOrganizer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {existingOrganizer.status === 'approved' ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : existingOrganizer.status === 'pending_approval' ? (
                  <Clock className="w-10 h-10 text-yellow-600" />
                ) : existingOrganizer.status === 'rejected' ? (
                  <AlertCircle className="w-10 h-10 text-red-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-gray-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {existingOrganizer.status === 'approved' && 'You\'re an Approved Organizer!'}
                {existingOrganizer.status === 'pending_approval' && 'Application Under Review'}
                {existingOrganizer.status === 'rejected' && 'Application Rejected'}
                {existingOrganizer.status === 'suspended' && 'Account Suspended'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingOrganizer.status === 'approved' && (
                <>
                  <p className="text-center text-slate-600">
                    Congratulations! You can now create and manage events on Protocol.
                  </p>
                  <div className="grid grid-cols-3 gap-4 my-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{existingOrganizer.events_organized || 0}</p>
                      <p className="text-sm text-slate-600">Events Organized</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{existingOrganizer.total_attendees || 0}</p>
                      <p className="text-sm text-slate-600">Total Attendees</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{existingOrganizer.rating?.toFixed(1) || 'N/A'}</p>
                      <p className="text-sm text-slate-600">Avg Rating</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => window.location.href = createPageUrl('Events')} 
                      className="flex-1"
                    >
                      Create New Event
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = createPageUrl('OrganizerDashboard')} 
                      className="flex-1"
                    >
                      My Dashboard
                    </Button>
                  </div>
                </>
              )}
              
              {existingOrganizer.status === 'pending_approval' && (
                <>
                  <p className="text-center text-slate-600">
                    Your application is being reviewed by our team. We'll notify you once it's approved.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>What's Next:</strong>
                      <br/>• Our team will review your profile
                      <br/>• Approval typically takes 24-48 hours
                      <br/>• You'll receive an email notification
                    </p>
                  </div>
                  {hasRoleAccess && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Good news!</strong> As a verified {user.app_role}, you can already access the Organizer Dashboard while waiting for your custom profile approval.
                      </p>
                      <Button 
                        onClick={() => window.location.href = createPageUrl('OrganizerDashboard')}
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      >
                        Access Dashboard Now
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = createPageUrl('Dashboard')} 
                    className="w-full"
                  >
                    Back to Dashboard
                  </Button>
                </>
              )}
              
              {existingOrganizer.status === 'rejected' && (
                <>
                  <p className="text-center text-slate-600">
                    Unfortunately, your application was not approved at this time.
                  </p>
                  {existingOrganizer.rejection_reason && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Reason:</strong> {existingOrganizer.rejection_reason}
                      </p>
                    </div>
                  )}
                  {hasRoleAccess && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Good news!</strong> Despite the rejection of your custom organizer profile, you can still organize events using your {user.app_role} account.
                      </p>
                      <Button 
                        onClick={() => window.location.href = createPageUrl('OrganizerDashboard')}
                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      >
                        Access Dashboard
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-center text-slate-500">
                    You can contact support for more information or reapply after addressing the concerns.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = createPageUrl('Contact')} 
                    className="w-full"
                  >
                    Contact Support
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show application form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Become an Event Organizer</h1>
          <p className="text-lg text-slate-600">Host events, build your community, and earn revenue</p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Reach Thousands</h3>
              <p className="text-sm text-slate-600">Connect with our active community of traders and investors</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Earn Revenue</h3>
              <p className="text-sm text-slate-600">Monetize your events with ticket sales (80% revenue share)</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Build Authority</h3>
              <p className="text-sm text-slate-600">Establish yourself as a thought leader in finance</p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Organizer Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="How you want to be known"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization_name">Organization Name (Optional)</Label>
                    <Input
                      id="organization_name"
                      value={formData.organization_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                      placeholder="Company or organization"
                    />
                  </div>
                </div>
              </div>

              {/* About */}
              <div>
                <Label htmlFor="bio">About You *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your experience in organizing events and your expertise in finance..."
                  rows={4}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 100 characters</p>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Business Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone Number (Optional)</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Specialization */}
              <div>
                <Label>Event Specialization</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {['Webinars', 'Workshops', 'Seminars', 'Conferences', 'Networking Events', 'Training Sessions'].map(spec => (
                    <Badge
                      key={spec}
                      variant={formData.specialization.includes(spec) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.specialization.includes(spec)) {
                          handleSpecializationRemove(spec);
                        } else {
                          handleSpecializationAdd(spec);
                        }
                      }}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Online Presence (Optional)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://your-website.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>By submitting this application, you agree to:</strong>
                </p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                  <li>Follow Protocol's community guidelines</li>
                  <li>20% platform commission on ticket sales</li>
                  <li>Maintain professional conduct at all events</li>
                  <li>Provide accurate event information</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.location.href = createPageUrl('Dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}