'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Building2, Info, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { inputClasses } from '@/components/ui/input';

interface CompanyProfile {
  id: string;
  organizationname: string;
  companyname: string;
  email: string;
  phone: string;
  website: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  postalcode: string;
  country: string;
  signatoryname: string;
  signatorytitle: string;
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
    organizationname: '',
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
    signatorytitle: '',
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
      const response = await fetch('/api/company-profile', { cache: 'no-store' });
      const data = await response.json();
      setCanEdit(!!data.canEdit);
      const orgName = data.organizationName || '';
      setFormData(prev => ({
        ...prev,
        organizationname: orgName,
        ...(data.profile ? {
          id: data.profile.id,
          companyname: data.profile.companyName || orgName,
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
          signatorytitle: data.profile.signatoryTitle || '',
        } : {
          companyname: orgName,
        }),
      }));
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
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Company profile saved successfully.' });
        setTimeout(() => setMessage(null), 3000);
        fetchProfile();
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">

      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Company Profile</h3>
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
            <p className="text-sm font-semibold text-ink mb-0.5">Saves you time</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Fill this in once and we&apos;ll auto-fill your company details as Party A every time you create a new NDA. All fields are optional.
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
              Only organization owners and signers can update the company profile.
            </p>
          </div>
        )}

        {/* Save message */}
        {message && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-teal-50 border border-teal-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              message.type === 'success' ? 'bg-teal-100' : 'bg-red-100'
            }`}>
              {message.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-teal-700" />
                : <AlertCircle className="w-4 h-4 text-red-600" />
              }
            </div>
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-teal-800' : 'text-red-800'
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
                  Organization Name
                </label>
                <input
                  type="text"
                  name="organizationname"
                  value={formData.organizationname}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="e.g., Acme Corp"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-gray-400">Your workspace name — shown on your team page and in notifications.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Legal Company Name
                </label>
                <input
                  type="text"
                  name="companyname"
                  value={formData.companyname}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="e.g., Acme Corporation Inc."
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-gray-400">Used as Party A in NDA documents.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="contact@company.com"
                  className={inputClasses}
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
                  className={inputClasses}
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
                  className={inputClasses}
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
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="addressline1"
                  value={formData.addressline1}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="123 Main Street"
                  className={inputClasses}
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
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="San Francisco"
                  className={inputClasses}
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
                  className={inputClasses}
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
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="United States"
                  className={inputClasses}
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
                  Signatory Name
                </label>
                <input
                  type="text"
                  name="signatoryname"
                  value={formData.signatoryname}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="John Smith"
                  className={inputClasses}
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
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button type="submit" disabled={saving}>
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
