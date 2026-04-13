'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Building2, Info, Lock, CheckCircle, AlertCircle } from 'lucide-react';

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

const inputClass = (disabled: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors duration-150 ${
    disabled
      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
      : 'border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
  }`

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
        setMessage({ type: 'success', text: 'Company profile saved successfully.' });
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading company profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Company Profile</h3>
            <p className="text-sm text-gray-500">Default company information for NDA generation</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Info callout */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Quick NDA Generation</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              This information will be automatically filled in as Party A when you create a new NDA.
              You can always modify these details for individual NDAs.
            </p>
          </div>
        </div>

        {/* Permission warning */}
        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-amber-200">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              Only organization owners and approvers can update the company profile.
            </p>
          </div>
        )}

        {/* Save message */}
        {message && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {message.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <AlertCircle className="w-4 h-4 text-red-600" />
              }
            </div>
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Company Information */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">1. Company Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="+1 (555) 123-4567"
                  className={inputClass(!canEdit)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="https://www.company.com"
                  className={inputClass(!canEdit)}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Section 2: Address */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">2. Address</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                  className={inputClass(!canEdit)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressline2"
                  value={formData.addressline2}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="Suite 100"
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  State / Province
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="California"
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalcode"
                  value={formData.postalcode}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="94102"
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                  className={inputClass(!canEdit)}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Section 3: Authorized Signatory */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">3. Authorized Signatory</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                  className={inputClass(!canEdit)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Signatory Title
                </label>
                <input
                  type="text"
                  name="signatorytitle"
                  value={formData.signatorytitle}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="CEO"
                  className={inputClass(!canEdit)}
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
