'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface CompanyProfile {
  id: string;
  companyname: string;
  email: string;
  phone?: string;
  website?: string;
  addressline1: string;
  addressline2?: string;
  city: string;
  state?: string;
  postalcode?: string;
  country: string;
  signatoryname: string;
  signatorytitle?: string;
}

export default function CompanyProfileSettingsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  
  const [formData, setFormData] = useState<CompanyProfile>({
    id: '',
    companyname: '',
    email: '',
    phone: '',
    website: '',
    addressline1: '',
    addressline2: '',
    city: '',
    state: '',
    postalcode: '',
    country: '',
    signatoryname: '',
    signatorytitle: ''
  });

  // Load existing profile
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    fetchProfile();
  }, [isLoaded, isSignedIn, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/company-profile');
      const data = await response.json();
      
      setCanEdit(!!data.canEdit);

      if (data.profile) {
        setFormData({
          id: data.profile.id,
          companyname: data.profile.companyName || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          website: data.profile.website || '',
          addressline1: data.profile.address || '',
          addressline2: data.profile.addressLine2 || '',
          city: data.profile.city || '',
          state: data.profile.state || '',
          postalcode: data.profile.zipCode || '',
          country: data.profile.country || '',
          signatoryname: data.profile.signatoryName || '',
          signatorytitle: data.profile.signatoryTitle || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load company profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/company-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company profile saved successfully!' });
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save company profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium text-sm">Loading company profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Company Profile</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Set your default company information for quick NDA generation
        </p>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Quick NDA Generation</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This information will be automatically filled in as Party A when you create a new NDA, saving you time. 
                  You can always modify these details for individual NDAs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!canEdit && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-amber-800 font-medium">
                Only organization owners and approvers can update the company profile.
              </p>
            </div>
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
            <div className="flex items-center gap-3">
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              1. Company Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyname"
                  value={formData.companyname}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="e.g., Acme Corporation Inc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="https://www.company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              2. Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressline1"
                  value={formData.addressline1}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="123 Main Street"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressline2"
                  value={formData.addressline2}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="Suite 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="San Francisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="California"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalcode"
                  value={formData.postalcode}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="94102"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="United States"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              3. Authorized Signatory
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signatory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="signatoryname"
                  value={formData.signatoryname}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signatory Title
                </label>
                <input
                  type="text"
                  name="signatorytitle"
                  value={formData.signatorytitle}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="CEO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
