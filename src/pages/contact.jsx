
import React from "react"; // Removed useState and useEffect as they are now handled by the hook
import InquiryForm from '../components/contact/InquiryForm';
import { Mail, Phone, MapPin } from 'lucide-react';
// import { PlatformSetting } from "@/api/entities"; // Not needed directly in this component anymore
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { usePlatformSettings } from "../components/hooks/usePlatformSettings";

export default function ContactPage() {
  const { settings } = usePlatformSettings();

  // The previous state and effect for loading settings are replaced by the usePlatformSettings hook.
  // const [settings, setSettings] = useState({
  //   support_email: 'support@protocol.in', // Default value
  //   support_phone: '+91-80-4567-8900', // Default value
  //   site_name: 'Protocol' // Default value
  // });

  // useEffect(() => {
  //   loadSettings();
  // }, []);

  // const loadSettings = async () => {
  //   try {
  //     const fetchedSettings = await PlatformSetting.list();
  //     const settingsMap = fetchedSettings.reduce((acc, setting) => {
  //       acc[setting.setting_key] = setting.setting_value;
  //       return acc;
  //     }, {});
      
  //     setSettings(prev => ({
  //       ...prev,
  //       ...settingsMap
  //     }));
  //   } catch (error) {
  //     console.error('Error loading contact settings:', error);
  //     // Optionally, you might want to set an error state or display a message
  //   }
  // };

  // It's good practice to ensure settings are available before rendering,
  // especially if the hook might return undefined initially.
  // However, assuming usePlatformSettings provides immediate defaults or handles loading state internally,
  // we can proceed directly. If settings can be null/undefined initially,
  // a loading spinner or conditional rendering might be needed here.
  // For this change, we assume `settings` object is always available with at least default values.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-700 bg-clip-text text-transparent mb-4">
            Contact {settings.site_name}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have questions, feedback, or need support? We're here to help you succeed in your trading journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-blue-600" />
                Get in Touch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.support_email && (
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-100 flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email Support</h3>
                    <p className="text-slate-600">{settings.support_email}</p>
                    <p className="text-sm text-slate-500">We typically respond within 24 hours</p>
                  </div>
                </div>
              )}

              {settings.support_phone && (
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Phone Support</h3>
                    <p className="text-slate-600">{settings.support_phone}</p>
                    <p className="text-sm text-slate-500">Available Monday - Friday, 9 AM - 6 PM IST</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-purple-100 flex-shrink-0">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Office Location</h3>
                  <p className="text-slate-600">Bangalore, Karnataka, India</p>
                  <p className="text-sm text-slate-500">Serving traders across India</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <InquiryForm supportEmail={settings.support_email} />
        </div>
      </div>
    </div>
  );
}
