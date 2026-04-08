import { supabase } from '../lib/supabaseClient';

export const logActivity = async (type, description, asset_tag = null, user_id = null, details = {}) => {
  try {
    const { data, error } = await supabase.from('activities').insert([
      { type, description, asset_tag, user_id, details }
    ]);

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Exception logging activity:', err);
    return null;
  }
};
