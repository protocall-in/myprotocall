
import React from "react";
import {
  Shield,
  FileText,
  Lock,
  Cookie,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  CheckCircle,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePlatformSettings } from "../hooks/usePlatformSettings";

export default function PageFooter() {
  const { settings } = usePlatformSettings();

  return (
    <footer className="mt-16 bg-gradient-to-r from-blue-900 via-blue-800 to-purple-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Protocol Branding Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bb21f4e5ccdcab161121f6/1dc7cf9b7_FinancialNetworkingLogoProtocol.png"
                alt="Protocol Logo"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold">{settings.site_name}</span>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              India's largest retail investor community. Join thousands of traders making informed decisions together.
            </p>
            
            {/* Dynamic Social Media Icons */}
            <div className="flex gap-4">
              {settings.social_link_twitter && settings.social_link_twitter !== '#' && (
                <a 
                  href={settings.social_link_twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings.social_link_linkedin && settings.social_link_linkedin !== '#' && (
                <a 
                  href={settings.social_link_linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {settings.social_link_instagram && settings.social_link_instagram !== '#' && (
                <a 
                  href={settings.social_link_instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_link_youtube && settings.social_link_youtube !== '#' && (
                <a 
                  href={settings.social_link_youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal & Compliance</h3>
            <div className="space-y-3">
              <Link 
                to={createPageUrl("Terms")} 
                className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
              >
                <FileText className="w-4 h-4 group-hover:text-blue-300" />
                <span className="text-sm">Terms of Service</span>
              </Link>
              <Link 
                to={createPageUrl("Privacy")} 
                className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
              >
                <Lock className="w-4 h-4 group-hover:text-blue-300" />
                <span className="text-sm">Privacy Policy</span>
              </Link>
              <Link 
                to={createPageUrl("Cookies")} 
                className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
              >
                <Cookie className="w-4 h-4 group-hover:text-blue-300" />
                <span className="text-sm">Cookies Policy</span>
              </Link>
              <Link 
                to={createPageUrl("RiskDisclosure")} 
                className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
              >
                <AlertTriangle className="w-4 h-4 group-hover:text-blue-300" />
                <span className="text-sm">Risk Disclosure</span>
              </Link>
              <Link 
                to={createPageUrl("contact")} 
                className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
              >
                <Mail className="w-4 h-4 group-hover:text-blue-300" />
                <span className="text-sm">Contact Us</span>
              </Link>
            </div>
          </div>

          {/* Regulatory */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Regulatory</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-blue-100">SEBI Registered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-blue-100">RBI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-blue-100">ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          {/* Dynamic Contact & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact & Support</h3>
            <div className="space-y-3">
              {settings.support_email && (
                <a 
                  href={`mailto:${settings.support_email}`} 
                  className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
                >
                  <Mail className="w-4 h-4 group-hover:text-blue-300" />
                  <div>
                    <span className="text-sm block">{settings.support_email}</span>
                    <span className="text-xs text-blue-200">General queries</span>
                  </div>
                </a>
              )}
              
              {settings.support_phone && (
                <a 
                  href={`tel:${settings.support_phone}`} 
                  className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
                >
                  <Phone className="w-4 h-4 group-hover:text-blue-300" />
                  <div>
                    <span className="text-sm block">{settings.support_phone}</span>
                    <span className="text-xs text-blue-200">24/7 Support</span>
                  </div>
                </a>
              )}
              
              <Link
                to={createPageUrl("Feedback")}
                className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors group"
              >
                <MessageCircle className="w-4 h-4 group-hover:text-blue-300" />
                <div>
                  <span className="text-sm block">Share Feedback</span>
                  <span className="text-xs text-blue-200">Help us improve</span>
                </div>
              </Link>

              <div className="flex items-start gap-2 text-blue-100">
                <MapPin className="w-4 h-4 mt-1" />
                <div>
                  <span className="text-sm block">Bangalore, Karnataka</span>
                  <span className="text-xs text-blue-200">India</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-blue-100">
              © 2025 {settings.site_name}. All rights reserved. | India's Retail Investor Community
            </p>
            <div className="flex gap-6 text-sm">
              <Link 
                to={createPageUrl("Sitemap")} 
                className="text-blue-100 hover:text-white transition-colors"
              >
                Sitemap
              </Link>
              <Link 
                to={createPageUrl("Accessibility")} 
                className="text-blue-100 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
              <span className="text-blue-100">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
