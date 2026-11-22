import { supabase } from './supabase';

/**
 * Personal Task Service (N164)
 * Supabase calls for personal tasks and personal task completion tracking.
 * Never send member_id or organization_id (handled by database triggers).
 */

export async function fetchMyTasks() {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from('personal_tasks')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function fetchMyDoneRows(sinceDateStr) {
  if (!supabase) return { data: [], error: null };
  let query = supabase.from('personal_task_done').select('*');
  if (sinceDateStr) {
    query = query.gte('done_on', sinceDateStr);
  }
  const { data, error } = await query;
  return { data: data || [], error };
}

export async function createTask(fields) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const { member_id, organization_id, ...payload } = fields;
  const { data, error } = await supabase
    .from('personal_tasks')
    .insert([payload])
    .select()
    .single();
  return { data, error };
}

export async function updateTask(id, fields) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const { member_id, organization_id, id: _id, ...payload } = fields;
  const { data, error } = await supabase
    .from('personal_tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteTask(id) {
  if (!supabase) return { error: null };
  const { error } = await supabase
    .from('personal_tasks')
    .delete()
    .eq('id', id);
  return { error };
}

export async function setOneTimeDone(id, done) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const { data, error } = await supabase
    .from('personal_tasks')
    .update({ status: done ? 'done' : 'open' })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function tickOccurrence(taskId, dateStr) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const { data, error } = await supabase
    .from('personal_task_done')
    .insert([{ task_id: taskId, done_on: dateStr }])
    .select()
    .single();
  return { data, error };
}

export async function untickOccurrence(taskId, dateStr) {
  if (!supabase) return { error: null };
  const { error } = await supabase
    .from('personal_task_done')
    .delete()
    .eq('task_id', taskId)
    .eq('done_on', dateStr);
  return { error };
}

export async function stopTask(id) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  const { data, error } = await supabase
    .from('personal_tasks')
    .update({ stopped: true })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function cleanupMyTaskHistory() {
  if (!supabase) return { error: null };
  try {
    const { error } = await supabase.rpc('cleanup_my_task_history');
    return { error };
  } catch (err) {
    return { error: err };
  }
}
