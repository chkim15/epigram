import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useActiveLearning() {
  const [isActiveLearningMode, setIsActiveLearningMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchUserPreference();
    } else {
      setIsActiveLearningMode(false);
      setLoading(false);
    }
  }, [user]);

  const fetchUserPreference = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('active_learning_mode')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active learning preference:', error);
      }

      if (data) {
        setIsActiveLearningMode(data.active_learning_mode ?? false);
      }
    } catch (err) {
      console.error('Error fetching active learning preference:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveLearningMode = async () => {
    if (!user) return;

    const newValue = !isActiveLearningMode;
    setIsActiveLearningMode(newValue);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ active_learning_mode: newValue })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating active learning preference:', error);
        setIsActiveLearningMode(!newValue);
      }
    } catch (err) {
      console.error('Error updating active learning preference:', err);
      setIsActiveLearningMode(!newValue);
    }
  };

  return {
    isActiveLearningMode,
    toggleActiveLearningMode,
    loading
  };
}