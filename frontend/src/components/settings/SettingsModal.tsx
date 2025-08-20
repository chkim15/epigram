"use client";

import { useState, useEffect } from 'react';
import { X, User, Palette, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, deleteAccount } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'account' | 'personalization' | 'account-management'>('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset to account tab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('account');
    }
  }, [isOpen]);

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
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Name</span>
        <span className="text-sm text-gray-900 dark:text-white">{getUserName(user)}</span>
      </div>

      {/* Email */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Email</span>
        <span className="text-sm text-gray-900 dark:text-white">{user?.email || 'N/A'}</span>
      </div>

      {/* Date Created */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Date Created</span>
        <span className="text-sm text-gray-900 dark:text-white">{formatDate(user?.created_at)}</span>
      </div>

      {/* School */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">School</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">University of Pennsylvania</span>
      </div>

      {/* Courses */}
      <div className="flex items-center justify-between py-3">
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Courses</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">Mathematics</span>
      </div>
    </div>
  );

  const renderPersonalizationTab = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Personalization options coming soon...
      </p>
    </div>
  );

  const renderAccountManagementTab = () => (
    <div className="space-y-6">
      {/* Delete Account Section */}
      <div className="rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Delete Account
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-lg flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
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
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl h-[600px] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-700">
          {/* Close button */}
          <div className="flex justify-start items-center mb-8">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm ${
                activeTab === 'account'
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </button>

            <button
              onClick={() => setActiveTab('personalization')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm ${
                activeTab === 'personalization'
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              Personalization
            </button>

            <button
              onClick={() => setActiveTab('account-management')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm ${
                activeTab === 'account-management'
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Account Management
            </button>
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-6">
          {/* Tab Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 capitalize">
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