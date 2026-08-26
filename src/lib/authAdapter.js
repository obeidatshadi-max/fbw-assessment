import { supabase } from './supabaseClient.js';

export const noopAuthAdapter = {
  async signInWithEmail() {
    return { success: false, error: 'Sign-in is not configured yet.' };
  },
  async saveAssessment() {
    return { success: false, error: 'Saving is not configured yet.' };
  },
  async getSession() {
    return null;
  },
  onAuthStateChange() {
    return () => {};
  },
};

export const supabaseAuthAdapter = {
  async signInWithEmail(email) {
    if (!supabase) return { success: false, error: 'Sign-in is not configured yet.' };
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error ? { success: false, error: error.message } : { success: true };
  },
  async saveAssessment({ p1Answers, orgAnswers, reportData, userId }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
    const { error: profileError } = await supabase.from('profiles').upsert({ id: userId }, { ignoreDuplicates: true });
    if (profileError) return { success: false, error: profileError.message };
    const { error } = await supabase.from('assessments').insert({
      profile_id: userId,
      scenario_answers: p1Answers,
      org_answers: orgAnswers,
      scores: { most: reportData.ind.most, least: reportData.ind.least, org: reportData.org },
    });
    return error ? { success: false, error: error.message } : { success: true };
  },
  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  onAuthStateChange(callback) {
    if (!supabase) return () => {};
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },
};
