"use client";

import { useState, useEffect } from 'react';
import { X, User, Trash2, Check, Briefcase } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import {
  BACKGROUND_OPTIONS,
  FIRM_OPTIONS,
  PREP_LEVEL_OPTIONS,
  ROLE_OPTIONS,
  TIMELINE_OPTIONS,
  type Background,
  type FirmSlug,
  type PrepLevel,
  type RoleType,
  type Timeline,
} from '@/lib/onboarding/options';
// TEMPORARY: SubscriptionTab hidden — everything is free
// import SubscriptionTab from './SubscriptionTab';

interface UserProfile {
  background: Background | null;
  target_firms: FirmSlug[];
  target_firms_other: string | null;
  role_type: RoleType | null;
  timeline: Timeline | null;
  prep_level: PrepLevel | null;
  onboarding_completed: boolean;
}

type SettingsTab =
  | 'account'
  | 'profile'
  | 'subscription'
  | 'account-management';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export default function SettingsModal({ isOpen, onClose, initialTab = 'account' }: SettingsModalProps) {
  const { user, deleteAccount } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile tab edit state
  const [profileBackground, setProfileBackground] = useState<Background | ''>('');
  const [profileFirms, setProfileFirms] = useState<FirmSlug[]>([]);
  const [profileFirmsOther, setProfileFirmsOther] = useState('');
  const [profileRole, setProfileRole] = useState<RoleType | ''>('');
  const [profileTimeline, setProfileTimeline] = useState<Timeline | ''>('');
  const [profilePrep, setProfilePrep] = useState<PrepLevel | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Set to initial tab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (user && isOpen) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('background, target_firms, target_firms_other, role_type, timeline, prep_level, onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const typed = profile as unknown as UserProfile;
          setProfileBackground((typed.background as Background) ?? '');
          setProfileFirms(typed.target_firms ?? []);
          setProfileFirmsOther(typed.target_firms_other ?? '');
          setProfileRole((typed.role_type as RoleType) ?? '');
          setProfileTimeline((typed.timeline as Timeline) ?? '');
          setProfilePrep((typed.prep_level as PrepLevel) ?? '');
          setSaveStatus('idle');
        }
      }
    }

    fetchUserProfile();
  }, [user, isOpen]);

  const toggleProfileFirm = (firm: FirmSlug) => {
    setSaveStatus('idle');
    setProfileFirms((prev) =>
      prev.includes(firm) ? prev.filter((f) => f !== firm) : [...prev, firm],
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus('idle');
    const otherFundsSelected = profileFirms.includes('other_funds');
    const { error } = await supabase
      .from('user_profiles')
      .update({
        background: profileBackground || null,
        target_firms: profileFirms,
        target_firms_other: otherFundsSelected ? profileFirmsOther.trim() : null,
        role_type: profileRole || null,
        timeline: profileTimeline || null,
        prep_level: profilePrep || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    setIsSaving(false);
    if (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      return;
    }
    setSaveStatus('saved');
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserName = (user: SupabaseUser | null) => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const { error } = await deleteAccount();
    
    if (!error) {
      // Account deleted successfully, redirect to landing page
      window.location.href = '/';
    } else {
      // Handle error - could show an error message
      alert('Failed to delete account. Please try again.');
    }
    
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const renderAccountTab = () => (
    <div className="space-y-5">
      {/* Name */}
      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Name</span>
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{getUserName(user)}</span>
      </div>

      {/* Email */}
      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Email</span>
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{user?.email || 'N/A'}</span>
      </div>

      {/* Date Created */}
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Date Created</span>
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{formatDate(user?.created_at)}</span>
      </div>
    </div>
  );

  const otherFundsSelected = profileFirms.includes('other_funds');

  const renderProfileTab = () => (
    <div className="space-y-6 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
      {/* Background */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Background
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {BACKGROUND_OPTIONS.map((opt) => {
            const selected = profileBackground === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSaveStatus('idle');
                  setProfileBackground(opt.value);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left"
                style={{
                  borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                  backgroundColor: selected ? 'var(--accent)' : 'transparent',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {opt.label}
                </span>
                {selected && (
                  <Check className="w-4 h-4 ml-auto" style={{ color: 'var(--foreground)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target firms */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Target firms
        </h4>
        <div className="space-y-1.5">
          {FIRM_OPTIONS.map((firm) => {
            const selected = profileFirms.includes(firm.value);
            const showOtherInput = firm.value === 'other_funds' && otherFundsSelected;
            return (
              <div key={firm.value}>
                <button
                  onClick={() => toggleProfileFirm(firm.value)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer text-left"
                  style={{
                    borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                    backgroundColor: selected ? 'var(--accent)' : 'transparent',
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${selected ? 'var(--foreground)' : 'var(--muted-foreground)'}`,
                      backgroundColor: selected ? 'var(--foreground)' : 'transparent',
                    }}
                  >
                    {selected && (
                      <Check className="w-3 h-3" style={{ color: 'var(--background)' }} />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {firm.label}
                  </span>
                </button>
                {showOtherInput && (
                  <input
                    type="text"
                    value={profileFirmsOther}
                    onChange={(e) => {
                      setSaveStatus('idle');
                      setProfileFirmsOther(e.target.value);
                    }}
                    placeholder="Which ones?"
                    className="mt-1.5 w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border)',
                      color: '#141310',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Role type */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Target role
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {ROLE_OPTIONS.map((opt) => {
            const selected = profileRole === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSaveStatus('idle');
                  setProfileRole(opt.value);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left"
                style={{
                  borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                  backgroundColor: selected ? 'var(--accent)' : 'transparent',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{opt.label}</span>
                {selected && <Check className="w-4 h-4 ml-auto" style={{ color: 'var(--foreground)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Timeline
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {TIMELINE_OPTIONS.map((opt) => {
            const selected = profileTimeline === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSaveStatus('idle');
                  setProfileTimeline(opt.value);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left"
                style={{
                  borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                  backgroundColor: selected ? 'var(--accent)' : 'transparent',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{opt.label}</span>
                {selected && <Check className="w-4 h-4 ml-auto" style={{ color: 'var(--foreground)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prep level */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Current preparation
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {PREP_LEVEL_OPTIONS.map((opt) => {
            const selected = profilePrep === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSaveStatus('idle');
                  setProfilePrep(opt.value);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left"
                style={{
                  borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                  backgroundColor: selected ? 'var(--accent)' : 'transparent',
                }}
              >
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{opt.label}</span>
                {selected && <Check className="w-4 h-4 ml-auto" style={{ color: 'var(--foreground)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saveStatus === 'saved' && (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs" style={{ color: '#b91c1c' }}>
            Could not save. Try again.
          </span>
        )}
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)',
          }}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );

  const renderAccountManagementTab = () => (
    <div className="space-y-6">
      {/* Delete Account Section */}
      <div className="rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Delete Account
            </h4>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50/50 transition-colors cursor-pointer text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-[60]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-card rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Delete Account
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-xl transition-colors cursor-pointer text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors cursor-pointer text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl h-[600px] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-secondary p-6 border-r" style={{ borderColor: 'var(--border)' }}>
          {/* Close button */}
          <div className="flex justify-start items-center mb-8">
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer text-sm border-2"
              style={{
                backgroundColor: activeTab === 'account' ? 'var(--accent)' : 'transparent',
                borderColor: activeTab === 'account' ? 'var(--foreground)' : 'transparent',
                color: activeTab === 'account' ? 'var(--foreground)' : 'var(--muted-foreground)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'account') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'account') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }
              }}
            >
              <User className="w-4 h-4" />
              Account
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer text-sm border-2"
              style={{
                backgroundColor: activeTab === 'profile' ? 'var(--accent)' : 'transparent',
                borderColor: activeTab === 'profile' ? 'var(--foreground)' : 'transparent',
                color: activeTab === 'profile' ? 'var(--foreground)' : 'var(--muted-foreground)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'profile') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'profile') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }
              }}
            >
              <Briefcase className="w-4 h-4" />
              Profile
            </button>

            {/* TEMPORARY: Subscription tab hidden — everything is free */}

            <button
              onClick={() => setActiveTab('account-management')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer text-sm border-2"
              style={{
                backgroundColor: activeTab === 'account-management' ? 'var(--accent)' : 'transparent',
                borderColor: activeTab === 'account-management' ? 'var(--foreground)' : 'transparent',
                color: activeTab === 'account-management' ? 'var(--foreground)' : 'var(--muted-foreground)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'account-management') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'account-management') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Account Management
            </button>
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6">
          {/* Tab Title */}
          <h3 className="text-lg font-semibold mb-5 capitalize" style={{ color: 'var(--foreground)' }}>
            {activeTab === 'account-management' ? 'Account Management' : activeTab}
          </h3>

          {/* Tab Content */}
          {activeTab === 'account' && renderAccountTab()}
          {activeTab === 'profile' && renderProfileTab()}
          {/* TEMPORARY: Subscription tab hidden — everything is free */}
          {activeTab === 'account-management' && renderAccountManagementTab()}
        </div>
      </div>
    </div>
  );
}