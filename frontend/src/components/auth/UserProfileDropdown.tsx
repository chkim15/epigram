"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, CreditCard, LogOut, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@supabase/supabase-js';
import SettingsModal from '@/components/settings/SettingsModal';

interface UserProfileDropdownProps {
  user: User;
}

export default function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'profile' | 'subscription' | 'account-management'>('account');
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      {/* Profile Button - Compact avatar circle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-opacity cursor-pointer"
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
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
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-56 z-50 rounded-xl shadow-lg border py-1" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
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
              setIsOpen(false);
              router.push('/upgrade');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer text-sm"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pricing</span>
          </button>


          {/* Get Help */}
          <button
            onClick={() => {
              window.open('/contact', '_blank');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer text-sm"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Get Help</span>
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