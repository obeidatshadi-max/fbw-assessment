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
  async createRaterLink() {
    return { success: false, error: '360 feedback is not configured yet.' };
  },
  async validateRaterLink() {
    return { valid: false, error: '360 feedback is not configured yet.' };
  },
  async submitRaterResponse() {
    return { success: false, error: '360 feedback is not configured yet.' };
  },
  async get360Summary() {
    return { success: false, error: '360 feedback is not configured yet.' };
  },
  async createTeam() {
    return { success: false, error: 'Team dashboard is not configured yet.' };
  },
  async validateTeamCode() {
    return { valid: false };
  },
  async listTeams() {
    return { success: false, error: 'Team dashboard is not configured yet.' };
  },
  async getTeamSummary() {
    return { success: false, error: 'Team dashboard is not configured yet.' };
  },
};

export const supabaseAuthAdapter = {
  async signInWithEmail(email) {
    if (!supabase) return { success: false, error: 'Sign-in is not configured yet.' };
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error ? { success: false, error: error.message } : { success: true };
  },
  async saveAssessment({ role, p1Answers, orgAnswers, complianceAnswers, reportData, userId, teamId }) {
    if (!supabase) return { success: false, error: 'Saving is not configured yet.' };
    const { error: profileError } = await supabase.from('fbw_profiles').upsert({ id: userId }, { ignoreDuplicates: true });
    if (profileError) return { success: false, error: profileError.message };
    const { data, error } = await supabase.from('fbw_assessments').insert({
      profile_id: userId,
      role: role || null,
      team_id: teamId || null,
      scenario_answers: p1Answers,
      org_answers: orgAnswers,
      compliance_answers: complianceAnswers || null,
      scores: {
        most: reportData.ind.most,
        least: reportData.ind.least,
        org: reportData.org,
        complianceScore: reportData.compliance ? reportData.compliance.score : null,
      },
    }).select('id').single();
    if (error) return { success: false, error: error.message };
    return { success: true, assessmentId: data.id };
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

  // 360 feedback — leader side (authenticated)
  async createRaterLink({ assessmentId, userId }) {
    if (!supabase) return { success: false, error: '360 feedback is not configured yet.' };
    const { data, error } = await supabase.from('fbw_rater_links')
      .insert({ assessment_id: assessmentId, leader_profile_id: userId })
      .select('id').single();
    return error ? { success: false, error: error.message } : { success: true, linkId: data.id };
  },
  async get360Summary({ linkId }) {
    if (!supabase) return { success: false, error: '360 feedback is not configured yet.' };
    const { data, error } = await supabase.rpc('get_360_summary', { p_link_id: linkId });
    return error ? { success: false, error: error.message } : { success: true, count: data.count, scores: data.scores };
  },

  // 360 feedback — rater side (anonymous)
  async validateRaterLink({ linkId }) {
    if (!supabase) return { valid: false, error: '360 feedback is not configured yet.' };
    const { data, error } = await supabase.rpc('validate_rater_link', { p_link_id: linkId });
    if (error) return { valid: false, error: error.message };
    return { valid: Boolean(data.valid) };
  },
  async submitRaterResponse({ linkId, scores }) {
    if (!supabase) return { success: false, error: '360 feedback is not configured yet.' };
    const { error } = await supabase.from('fbw_rater_responses').insert({
      rater_link_id: linkId,
      dimension_scores: scores,
    });
    return error ? { success: false, error: error.message } : { success: true };
  },

  // Team dashboard — manager side (authenticated)
  async createTeam({ name, userId }) {
    if (!supabase) return { success: false, error: 'Team dashboard is not configured yet.' };
    const { error: managerError } = await supabase.from('fbw_managers').upsert({ id: userId }, { ignoreDuplicates: true });
    if (managerError) return { success: false, error: managerError.message };
    const { data, error } = await supabase.from('fbw_teams')
      .insert({ manager_id: userId, name })
      .select('id, join_code').single();
    return error ? { success: false, error: error.message } : { success: true, teamId: data.id, joinCode: data.join_code };
  },
  async listTeams({ userId }) {
    if (!supabase) return { success: false, error: 'Team dashboard is not configured yet.' };
    const { data, error } = await supabase.from('fbw_teams')
      .select('id, name, join_code')
      .eq('manager_id', userId)
      .order('created_at', { ascending: true });
    if (error) return { success: false, error: error.message };
    return { success: true, teams: data.map(row => ({ id: row.id, name: row.name, joinCode: row.join_code })) };
  },
  async getTeamSummary({ teamId }) {
    if (!supabase) return { success: false, error: 'Team dashboard is not configured yet.' };
    const { data, error } = await supabase.rpc('get_team_summary', { p_team_id: teamId });
    return error ? { success: false, error: error.message } : { success: true, count: data.count, distribution: data.distribution, roleBreakdown: data.roleBreakdown };
  },

  // Team dashboard — rep side (anonymous, called during self-assessment)
  async validateTeamCode({ code }) {
    if (!supabase) return { valid: false };
    const { data, error } = await supabase.rpc('validate_team_code', { p_code: code });
    if (error) return { valid: false };
    return { valid: Boolean(data.valid), teamId: data.team_id || null };
  },
};
