"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  User,
  CreditCard,
  Building
} from "lucide-react";
import { toast } from "sonner";

interface KYCStatus {
  _id?: string;
  status: 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected';
  fullName: string;
  dateOfBirth?: string;
  phoneNumber: string;
  email: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountType: 'savings' | 'current';
    isVerified: boolean;
  };
  submittedAt?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

interface KYCFormData {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountType: 'savings' | 'current';
  };
  documents: Array<{
    documentType: string;
    documentNumber: string;
    file?: File;
  }>;
}

export function KYCVerification() {
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<KYCFormData>({
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: '',
      branchName: '',
      accountType: 'savings',
    },
    documents: [
      { documentType: 'pan', documentNumber: '' },
      { documentType: 'aadhaar', documentNumber: '' },
    ],
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kyc/status');
      
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);
        
        // Pre-fill form with existing data
        if (data && data.status !== 'not_started') {
          setFormData(prevData => ({
            ...prevData,
            fullName: data.fullName || '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            address: data.address || prevData.address,
            bankDetails: data.bankDetails || prevData.bankDetails,
          }));
        }
      } else if (response.status === 404) {
        // No KYC record found, user can start KYC
        setKycStatus(null);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      toast.error('Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else if (field.startsWith('bankDetails.')) {
      const bankField = field.replace('bankDetails.', '');
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleDocumentChange = (index: number, field: string, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      ),
    }));
  };

  const handleSubmitKYC = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.fullName || !formData.dateOfBirth || !formData.phoneNumber || !formData.email) {
        toast.error('Please fill in all required personal information');
        return;
      }

      if (!formData.bankDetails.accountNumber || !formData.bankDetails.ifscCode) {
        toast.error('Please fill in all required bank details');
        return;
      }

      // Prepare submission data
      const submissionData = {
        fullName: formData.fullName,
        dateOfBirth: new Date(formData.dateOfBirth),
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        address: formData.address,
        bankDetails: formData.bankDetails,
        documents: formData.documents.map(doc => ({
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          documentUrl: doc.file ? `uploads/kyc/${doc.file.name}` : '', // Simplified for demo
        })),
      };

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        toast.success('KYC documents submitted successfully');
        fetchKYCStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
      case 'under_review':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'not_started':
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canSubmitKYC = () => {
    return !kycStatus || kycStatus.status === 'not_started' || kycStatus.status === 'rejected';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show status if KYC is already submitted and not editable
  if (kycStatus && !canSubmitKYC()) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>KYC Verification Status</CardTitle>
              </div>
              {getStatusBadge(kycStatus.status)}
            </div>
            <CardDescription>
              Your identity verification status and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <p className="text-sm text-muted-foreground">{kycStatus.fullName}</p>
              </div>
              <div>
                <Label>Phone Number</Label>
                <p className="text-sm text-muted-foreground">{kycStatus.phoneNumber}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{kycStatus.email}</p>
              </div>
              <div>
                <Label>Submitted Date</Label>
                <p className="text-sm text-muted-foreground">
                  {kycStatus.submittedAt ? new Date(kycStatus.submittedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {kycStatus.bankDetails && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Bank Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Holder Name</Label>
                    <p className="text-sm text-muted-foreground">{kycStatus.bankDetails.accountHolderName}</p>
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <p className="text-sm text-muted-foreground">{kycStatus.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <p className="text-sm text-muted-foreground">****{kycStatus.bankDetails.accountNumber.slice(-4)}</p>
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <p className="text-sm text-muted-foreground">{kycStatus.bankDetails.ifscCode}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={kycStatus.bankDetails.isVerified ? "default" : "secondary"}>
                    {kycStatus.bankDetails.isVerified ? 'Bank Details Verified' : 'Bank Verification Pending'}
                  </Badge>
                </div>
              </div>
            )}

            {kycStatus.status === 'rejected' && kycStatus.adminNotes && (
              <div className="border-t pt-4">
                <Label>Rejection Reason</Label>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{kycStatus.adminNotes}</p>
                <Button onClick={() => setKycStatus(null)} className="mt-2">
                  Resubmit KYC
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show KYC form
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Complete KYC Verification</CardTitle>
          </div>
          <CardDescription>
            Complete your identity verification to enable withdrawals and other features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Address Information</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  placeholder="Enter your street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    placeholder="Enter your state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Bank Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={formData.bankDetails.accountHolderName}
                  onChange={(e) => handleInputChange('bankDetails.accountHolderName', e.target.value)}
                  placeholder="Enter account holder name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleInputChange('bankDetails.bankName', e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleInputChange('bankDetails.accountNumber', e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => handleInputChange('bankDetails.ifscCode', e.target.value)}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  value={formData.bankDetails.branchName}
                  onChange={(e) => handleInputChange('bankDetails.branchName', e.target.value)}
                  placeholder="Enter branch name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select 
                  value={formData.bankDetails.accountType} 
                  onValueChange={(value) => handleInputChange('bankDetails.accountType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Identity Documents
            </h4>
            {formData.documents.map((document, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <Label>{document.documentType.toUpperCase()} Document</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`documentNumber-${index}`}>Document Number</Label>
                    <Input
                      id={`documentNumber-${index}`}
                      value={document.documentNumber}
                      onChange={(e) => handleDocumentChange(index, 'documentNumber', e.target.value)}
                      placeholder={`Enter ${document.documentType.toUpperCase()} number`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`documentFile-${index}`}>Upload Document</Label>
                    <Input
                      id={`documentFile-${index}`}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleDocumentChange(index, 'file', e.target.files?.[0] || '')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmitKYC}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit KYC Documents'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
