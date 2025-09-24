"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, CreditCard, Moon, LogOut, ChevronDown, BookOpen } from 'lucide-react';
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
  const [darkMode, setDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    // You can save this preference to localStorage or user preferences
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/app');
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
          backgroundColor: '#faf9f5',
          borderColor: 'rgb(240,238,230)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f4ee';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#faf9f5';
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
              <div className="w-full h-full flex items-center justify-center bg-pink-500 text-white font-medium text-xs">
                {getInitials()}
              </div>
            )}
          </div>
          {/* Name */}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {getDisplayName()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          {/* Settings */}
          <button
            onClick={handleSettingsClick}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {/* Pricing - Disabled */}
          <button
            disabled
            className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-400 dark:text-gray-500 cursor-not-allowed text-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pricing</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5" />
              <span>Dark mode</span>
            </div>
            <div className="relative">
              <div className={`w-8 h-4 rounded-full transition-colors ${
                darkMode 
                  ? 'bg-green-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}></div>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
            </div>
          </button>

          {/* Active Learning Toggle */}
          <button
            onClick={toggleActiveLearningMode}
            className="w-full flex items-center justify-between px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Active Learning</span>
            </div>
            <div className="relative">
              <div className={`w-8 h-4 rounded-full transition-colors ${
                isActiveLearningMode 
                  ? 'bg-green-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}></div>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isActiveLearningMode ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
            </div>
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Log out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
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
      />
    </div>
  );
}