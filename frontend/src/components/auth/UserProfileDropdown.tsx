"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, CreditCard, LogOut, ChevronDown, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@supabase/supabase-js';
import SettingsModal from '@/components/settings/SettingsModal';
import { useActiveLearning } from '@/hooks/useActiveLearning';

interface UserProfileDropdownProps {
  user: User;
}

export default function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'personalization' | 'subscription' | 'account-management'>('account');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isActiveLearningMode, toggleActiveLearningMode } = useActiveLearning();

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  // Get avatar URL - check user_metadata for avatar
  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || 
           user?.user_metadata?.picture || 
           null;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setIsOpen(false); // Close dropdown when opening settings
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--background)';
        }}
      >
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
            {getAvatarUrl() ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getAvatarUrl()}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-medium text-xs" style={{ backgroundColor: '#8b7355', color: 'white' }}>
                {getInitials()}
              </div>
            )}
          </div>
          {/* Name */}
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {getDisplayName()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl shadow-lg border py-1" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
          {/* Settings */}
          <button
            onClick={() => {
              setSettingsTab('account');
              handleSettingsClick();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer text-sm"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {/* Pricing */}
          <button
            onClick={() => {
              setSettingsTab('subscription');
              setIsSettingsOpen(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer text-sm"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pricing</span>
          </button>


          {/* Active Learning Toggle */}
          <button
            onClick={toggleActiveLearningMode}
            className="w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer text-sm"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Active Learning</span>
            </div>
            <div className="relative">
              <div className="w-8 h-4 rounded-full transition-colors" style={{
                backgroundColor: isActiveLearningMode ? '#10b981' : 'var(--muted)'
              }}></div>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isActiveLearningMode ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
            </div>
          </button>

          {/* Divider */}
          <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }}></div>

          {/* Log out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer text-sm"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />
    </div>
  );
}