"use client";

import { useState, useEffect } from 'react';
import { X, User, Palette, Trash2, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useAppTheme, themeConfigs, Theme } from '@/lib/utils/theme';

interface UserProfile {
  school: string | null;
  course: string | null;
  referral_source: string | null;
  onboarding_completed: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, deleteAccount } = useAuthStore();
  const { theme, setTheme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'account' | 'personalization' | 'account-management'>('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset to account tab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('account');
    }
  }, [isOpen]);

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (user && isOpen) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('school, course, referral_source, onboarding_completed')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      }
    }
    
    fetchUserProfile();
  }, [user, isOpen]);

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
      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Date Created</span>
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{formatDate(user?.created_at)}</span>
      </div>

      {/* School */}
      <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>School</span>
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {userProfile?.school || 'Not specified'}
        </span>
      </div>

      {/* Course */}
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Course</span>
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {userProfile?.course || 'Not specified'}
        </span>
      </div>
    </div>
  );

  const renderPersonalizationTab = () => {
    return (
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--foreground)' }}>
            Appearance
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {mounted && (Object.keys(themeConfigs) as Theme[]).map((themeName) => {
              const config = themeConfigs[themeName];
              const isSelected = theme === themeName;

              return (
                <button
                  key={themeName}
                  onClick={() => setTheme(themeName)}
                  className="flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer"
                  style={{
                    borderColor: isSelected ? '#3b82f6' : 'var(--border)',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--muted-foreground)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }
                  }}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {config.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {config.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ borderColor: 'var(--border)' }}
                      style={{ backgroundColor: config.preview.background }}
                    />
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ borderColor: 'var(--border)' }}
                      style={{ backgroundColor: config.preview.foreground }}
                    />
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ borderColor: 'var(--border)' }}
                      style={{ backgroundColor: config.preview.accent }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAccountManagementTab = () => (
    <div className="space-y-6">
      {/* Delete Account Section */}
      <div className="rounded-lg p-4">
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
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-[60]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Delete Account
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-lg transition-colors cursor-pointer text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-3xl h-[600px] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-secondary p-6 border-r" style={{ borderColor: 'var(--border)' }}>
          {/* Close button */}
          <div className="flex justify-start items-center mb-8">
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm"
              style={{
                backgroundColor: activeTab === 'account' ? 'var(--accent)' : 'transparent',
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
              onClick={() => setActiveTab('personalization')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm"
              style={{
                backgroundColor: activeTab === 'personalization' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'personalization' ? 'var(--foreground)' : 'var(--muted-foreground)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'personalization') {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'personalization') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }
              }}
            >
              <Palette className="w-4 h-4" />
              Personalization
            </button>

            <button
              onClick={() => setActiveTab('account-management')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm"
              style={{
                backgroundColor: activeTab === 'account-management' ? 'var(--accent)' : 'transparent',
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
          {activeTab === 'personalization' && renderPersonalizationTab()}
          {activeTab === 'account-management' && renderAccountManagementTab()}
        </div>
      </div>
    </div>
  );
}