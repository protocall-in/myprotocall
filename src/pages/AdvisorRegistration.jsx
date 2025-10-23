import React, { useState } from 'react';
import { User, Advisor } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UploadCloud, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { usePlatformSettings } from '../components/hooks/usePlatformSettings';

export default function AdvisorRegistration() {
    const { settings, usingDefaults } = usePlatformSettings();
    const [formData, setFormData] = useState({
        fullName: '',
        sebiNumber: '',
        email: '',
        password: '',
        bio: '',
    });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.email || !formData.password || !formData.fullName || !formData.sebiNumber) {
            toast.error("Please fill all required fields and upload your SEBI certificate.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Step 1: Upload the SEBI document
            const { file_url } = await UploadFile({ file });

            let currentUser;
            try {
                currentUser = await User.me();
            } catch (error) {
                toast.error("You must be logged in to register as an advisor.");
                setIsSubmitting(false);
                return;
            }

            // Step 2: Create the Advisor record with dynamic approval status
            const advisorData = {
                user_id: currentUser.id,
                display_name: formData.fullName,
                bio: formData.bio,
                sebi_registration_number: formData.sebiNumber,
                sebi_document_url: file_url,
                status: settings.advisorApprovalRequired ? 'pending_approval' : 'approved',
            };
            
            await Advisor.create(advisorData);

            setRegistrationSuccess(true);
            setApprovalStatus(settings.advisorApprovalRequired ? 'pending' : 'approved');
            
            if (settings.advisorApprovalRequired) {
                toast.success("Registration submitted! Your application is under review.");
            } else {
                toast.success("Registration successful! You are now approved as an advisor.");
            }

        } catch (error) {
            console.error("Advisor registration failed:", error);
            toast.error("Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100">
                <Card className="w-full max-w-md text-center p-8">
                    <CardHeader>
                        <CardTitle className={`text-2xl font-bold ${approvalStatus === 'approved' ? 'text-green-600' : 'text-blue-600'}`}>
                            {approvalStatus === 'approved' ? (
                                <>
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                    Application Approved!
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    Application Submitted!
                                </>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {approvalStatus === 'approved' ? (
                                "Congratulations! You are now approved as an advisor and can start providing recommendations immediately."
                            ) : (
                                "Thank you for registering. Our team will review your application and you will be notified via email once it's processed. This usually takes 2-3 business days."
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link to={createPageUrl("Dashboard")}>
                            <Button>Return to Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Become a Stock Advisor</CardTitle>
                    <CardDescription className="text-center">Join our platform as a SEBI Registered Advisor and share your expertise.</CardDescription>
                    
                    {/* Platform Settings Info */}
                    <div className="space-y-2 mt-4">
                        {settings.advisorApprovalRequired ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending Admin Approval Required
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Auto-Approval Enabled
                            </Badge>
                        )}
                        
                        <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium">Platform Commission: {settings.commissionRate}%</p>
                            <p>You'll receive {100 - settings.commissionRate}% of your advisor plan revenues.</p>
                        </div>

                        {usingDefaults && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                <AlertCircle className="w-3 h-3" />
                                <span>Default settings applied until admin configures values.</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} required />
                            <Input name="sebiNumber" placeholder="SEBI Registration Number" value={formData.sebiNumber} onChange={handleInputChange} required />
                            <Input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
                            <Input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                        </div>
                        <Textarea name="bio" placeholder="Short Bio / Advisory Focus (e.g., Technical Analysis, F&O)" value={formData.bio} onChange={handleInputChange} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">SEBI Certificate (PDF/JPEG)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">{file ? file.name : 'PDF, JPG up to 10MB'}</p>
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}