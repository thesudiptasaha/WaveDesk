import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import {
  fetchMyTasks,
  fetchMyDoneRows,
  createTask,
  updateTask,
  deleteTask,
  setOneTimeDone,
  tickOccurrence,
  untickOccurrence,
  stopTask,
  cleanupMyTaskHistory,
} from '../../services/personalTaskService';
import {
  todayDhaka,
  buildTodayPanel,
  describeRepeat,
} from '../../lib/core';
import { inputBase, btnPrimary, btnGhost, btnDanger, ConfirmDialog } from './Shared';

// Helper for date subtraction (pure UTC string math)
const subDaysYmd = (ymd, n) => {
  const [y, m, d] = (ymd || '').split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const ms = Date.UTC(y, m - 1, d) - n * 86400000;
  const res = new Date(ms);
  const ry = res.getUTCFullYear();
  const rm = String(res.getUTCMonth() + 1).padStart(2, '0');
  const rd = String(res.getUTCDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
};

const formatHeaderDate = (ymd) => {
  const [y, m, d] = (ymd || '').split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[utcDate.getUTCDay()]}, ${d} ${months[m - 1]}`;
};

const WEEKDAYS = [
  { val: 6, label: 'Sat' },
  { val: 0, label: 'Sun' },
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
];

let cleanedForMemberId = null;

export default function TodayPanel({
  actor,
  onOpenContentId,
  collapsible = false,
  defaultCollapsed = false,
  onPendingCountChange,
  className = '',
}) {
  const [todayDate, setTodayDate] = useState(() => todayDhaka());
  const todayRef = useRef(todayDate);
  todayRef.current = todayDate;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionError, setActionError] = useState(null);
  const actionErrorTimer = useRef(null);

  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible) return false;
    try {
      const saved = localStorage.getItem('wd-today-collapsed');
      if (saved !== null) return saved === 'true';
    } catch {}
    return defaultCollapsed;
  });

  // State strictly local to this component instance
  const [tasks, setTasks] = useState([]);
  const [doneRows, setDoneRows] = useState([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const doneRowsRef = useRef(doneRows);
  doneRowsRef.current = doneRows;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formContentId, setFormContentId] = useState('');
  const [formRepeatKind, setFormRepeatKind] = useState('none');
  const [formWeekdays, setFormWeekdays] = useState([]);
  const [formMonthDay, setFormMonthDay] = useState(1);
  const [formSkipFriday, setFormSkipFriday] = useState(false);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  // Row delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Active action menu open for task id
  const [menuTaskId, setMenuTaskId] = useState(null);

  const clearActionError = useCallback(() => {
    if (actionErrorTimer.current) clearTimeout(actionErrorTimer.current);
    setActionError(null);
  }, []);

  const showActionError = useCallback((msg) => {
    if (actionErrorTimer.current) clearTimeout(actionErrorTimer.current);
    setActionError(msg);
    actionErrorTimer.current = setTimeout(() => {
      setActionError(null);
    }, 6000);
  }, []);

  useEffect(() => () => {
    if (actionErrorTimer.current) clearTimeout(actionErrorTimer.current);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wd-today-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Load data
  const loadData = useCallback(async () => {
    setErrorMsg(null);
    const today = todayDhaka();
    setTodayDate(today);
    todayRef.current = today;

    // Demo mode: if supabase is null, keep tasks in local state
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const sinceDate = subDaysYmd(today, 45);
      const [tRes, dRes] = await Promise.all([
        fetchMyTasks(),
        fetchMyDoneRows(sinceDate),
      ]);

      if (tRes.error) {
        setErrorMsg(tRes.error.message || 'Failed to load tasks');
      } else {
        setTasks(tRes.data || []);
        setDoneRows(dRes.data || []);

        if (actor?.id && cleanedForMemberId !== actor.id) {
          cleanedForMemberId = actor.id;
          cleanupMyTaskHistory().catch(() => {});
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [actor?.id]);

  // When actor.id prop changes while mounted, clear tasks/doneRows immediately and reload
  const actorId = actor?.id;
  useEffect(() => {
    setTasks([]);
    setDoneRows([]);
    loadData();
  }, [actorId, loadData]);

  // Visibility change + interval polling + 1-minute date check outside setState updater
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Check Dhaka date change every 1 minute
    const dateInterval = setInterval(() => {
      const current = todayDhaka();
      if (current !== todayRef.current) {
        todayRef.current = current;
        setTodayDate(current);
        loadData();
      }
    }, 60000);

    // Refresh every 5 minutes while visible
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 5 * 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(dateInterval);
      clearInterval(pollInterval);
    };
  }, [loadData]);

  // Compute panel buckets
  const panelData = buildTodayPanel({
    tasks,
    doneRows,
    today: todayDate,
  });

  const pendingCount = panelData.overdue.length + panelData.today.length;

  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);

  // Close open row menu on outside click
  useEffect(() => {
    if (!menuTaskId) return;
    const handleClick = () => setMenuTaskId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [menuTaskId]);

  // Form open / reset
  const openNewForm = () => {
    clearActionError();
    setEditingTask(null);
    setFormTitle('');
    setFormNote('');
    setFormDueDate(todayDate);
    setFormDueTime('');
    setFormContentId('');
    setFormRepeatKind('none');
    setFormWeekdays([1]); // default Mon
    setFormMonthDay(1);
    setFormSkipFriday(false);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (task) => {
    clearActionError();
    setEditingTask(task);
    setFormTitle(task.title || '');
    setFormNote(task.note || '');
    setFormDueDate(task.due_date || '');
    setFormDueTime(task.due_time ? task.due_time.slice(0, 5) : '');
    setFormContentId(task.content_id || '');
    setFormRepeatKind(task.repeat_kind || 'none');
    setFormWeekdays(Array.isArray(task.repeat_weekdays) ? task.repeat_weekdays : []);
    setFormMonthDay(task.repeat_month_day || 1);
    setFormSkipFriday(!!task.skip_friday);
    setFormError('');
    setShowForm(true);
    setMenuTaskId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormError('');
  };

  const handleWeekdayToggle = (dayVal) => {
    setFormWeekdays((prev) => {
      if (prev.includes(dayVal)) {
        return prev.filter((d) => d !== dayVal);
      }
      return [...prev, dayVal];
    });
  };

  // Submit task (create or update)
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    clearActionError();
    setFormError('');

    const titleTrimmed = formTitle.trim();
    if (!titleTrimmed) {
      setFormError('Title is required');
      return;
    }
    if (titleTrimmed.length > 200) {
      setFormError('Title must be at most 200 characters');
      return;
    }
    if (formNote && formNote.length > 1000) {
      setFormError('Note must be at most 1000 characters');
      return;
    }
    if (formContentId && formContentId.length > 60) {
      setFormError('Content ID must be at most 60 characters');
      return;
    }

    const isRepeat = formRepeatKind !== 'none';
    if (isRepeat && !formDueDate) {
      setFormError('Start date is required for repeating tasks');
      return;
    }

    if (formRepeatKind === 'weekly' && formWeekdays.length === 0) {
      setFormError('Please select at least one weekday');
      return;
    }

    if (formRepeatKind === 'monthly') {
      const mDay = Number(formMonthDay);
      if (isNaN(mDay) || mDay < 1 || mDay > 31) {
        setFormError('Month day must be between 1 and 31');
        return;
      }
    }

    const payload = {
      title: titleTrimmed,
      note: formNote ? formNote.trim() : null,
      due_date: formDueDate || null,
      due_time: formDueDate && formDueTime ? formDueTime : null,
      content_id: formContentId ? formContentId.trim() : null,
      repeat_kind: formRepeatKind,
      repeat_weekdays: formRepeatKind === 'weekly' ? formWeekdays : null,
      repeat_month_day: formRepeatKind === 'monthly' ? Number(formMonthDay) : null,
      skip_friday: formRepeatKind === 'daily' ? formSkipFriday : false,
    };

    setFormBusy(true);

    if (!supabase) {
      // Demo mode
      if (editingTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...payload, updated_at: new Date().toISOString() } : t))
        );
      } else {
        const newTask = {
          id: `demo-${Date.now()}`,
          status: 'open',
          stopped: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...payload,
        };
        setTasks((prev) => [newTask, ...prev]);
      }
      setFormBusy(false);
      closeForm();
      return;
    }

    try {
      if (editingTask) {
        const { data, error } = await updateTask(editingTask.id, payload);
        if (error) {
          setFormError(error.message || 'Failed to update task');
        } else {
          setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? data : t)));
          closeForm();
        }
      } else {
        const { data, error } = await createTask(payload);
        if (error) {
          setFormError(error.message || 'Failed to create task');
        } else {
          setTasks((prev) => [data, ...prev]);
          closeForm();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Unexpected error occurred');
    } finally {
      setFormBusy(false);
    }
  };

  // Toggle tick (optimistic update with functional setState and snapshot rollback)
  const handleToggleTick = async (item, targetDone) => {
    clearActionError();
    const prevTasks = tasksRef.current;
    const prevDoneRows = doneRowsRef.current;

    if (item.kind === 'once') {
      const nowIso = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === item.task.id) {
            return {
              ...t,
              status: targetDone ? 'done' : 'open',
              done_at: targetDone ? nowIso : null,
            };
          }
          return t;
        })
      );

      if (supabase) {
        const { error } = await setOneTimeDone(item.task.id, targetDone);
        if (error) {
          setTasks(prevTasks);
          showActionError(`Failed to update task: ${error.message || 'Unknown error'}`);
        }
      }
    } else {
      const occDate = item.date;
      if (targetDone) {
        const newDoneRow = {
          task_id: item.task.id,
          done_on: occDate,
          created_at: new Date().toISOString(),
        };
        setDoneRows((prev) => [...prev, newDoneRow]);
      } else {
        setDoneRows((prev) =>
          prev.filter((r) => !(r.task_id === item.task.id && r.done_on === occDate))
        );
      }

      if (supabase) {
        if (targetDone) {
          const { error } = await tickOccurrence(item.task.id, occDate);
          if (error) {
            setDoneRows(prevDoneRows);
            showActionError(`Failed to tick occurrence: ${error.message || 'Unknown error'}`);
          }
        } else {
          const { error } = await untickOccurrence(item.task.id, occDate);
          if (error) {
            setDoneRows(prevDoneRows);
            showActionError(`Failed to untick occurrence: ${error.message || 'Unknown error'}`);
          }
        }
      }
    }
  };

  // Delete task (optimistic update with functional setState and snapshot rollback)
  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    clearActionError();
    const targetId = deleteTarget.id;
    setDeleteTarget(null);

    const prevTasks = tasksRef.current;
    const prevDoneRows = doneRowsRef.current;

    setTasks((prev) => prev.filter((t) => t.id !== targetId));
    setDoneRows((prev) => prev.filter((r) => r.task_id !== targetId));

    if (supabase) {
      const { error } = await deleteTask(targetId);
      if (error) {
        setTasks(prevTasks);
        setDoneRows(prevDoneRows);
        showActionError(`Failed to delete task: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Stop repeating task (optimistic update with functional setState and snapshot rollback)
  const handleStopRepeating = async (task) => {
    clearActionError();
    setMenuTaskId(null);
    const prevTasks = tasksRef.current;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, stopped: true } : t))
    );

    if (supabase) {
      const { error } = await stopTask(task.id);
      if (error) {
        setTasks(prevTasks);
        showActionError(`Failed to stop task: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Render a task row
  const renderRow = (item, isDoneSection = false) => {
    const { task } = item;
    const isOverdue = item.overdue;
    const repeatText = describeRepeat(task);

    return (
      <div
        key={item.key}
        className={`group flex items-start gap-2.5 rounded-xl border border-white/[0.04] p-2.5 transition hover:border-white/[0.09] hover:bg-white/[0.02] ${
          isDoneSection ? 'opacity-60' : ''
        }`}
      >
        {/* Checkbox button */}
        <button
          type="button"
          onClick={() => handleToggleTick(item, !isDoneSection)}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            isDoneSection
              ? 'border-emerald-500 bg-emerald-500 text-black'
              : 'border-white/20 bg-white/5 hover:border-white/40'
          }`}
          title={isDoneSection ? 'Mark incomplete' : 'Mark done'}
          aria-label={isDoneSection ? 'Mark incomplete' : 'Mark done'}
        >
          {isDoneSection && (
            <svg className="h-3 w-3 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 leading-snug">
            <span
              className={`text-[13px] font-medium break-words ${
                isDoneSection ? 'line-through text-zinc-500' : 'text-zinc-100'
              }`}
            >
              {task.title}
            </span>

            {/* Time badge */}
            {item.time && (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
                {item.time.slice(0, 5)}
              </span>
            )}

            {/* Content ID Chip */}
            {task.content_id && (
              <button
                type="button"
                onClick={() => onOpenContentId && onOpenContentId(task.content_id)}
                className={`rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.2 text-[10px] font-mono font-medium text-sky-400 transition hover:bg-sky-500/20 ${
                  onOpenContentId ? 'cursor-pointer' : 'cursor-default'
                }`}
                title={onOpenContentId ? 'Open content in drawer' : task.content_id}
              >
                {task.content_id}
              </button>
            )}
          </div>

          {/* Subtext: Overdue date / repeat label / note */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            {isOverdue && item.date && (
              <span className="font-semibold text-rose-400">
                Overdue ({item.date})
              </span>
            )}
            {!isOverdue && item.date && !isDoneSection && item.date !== todayDate && (
              <span className="text-zinc-400">{item.date}</span>
            )}
            {repeatText && (
              <span className="text-zinc-400">
                {repeatText}
              </span>
            )}
            {task.note && (
              <span className="text-zinc-500 truncate max-w-full" title={task.note}>
                · {task.note}
              </span>
            )}
          </div>
        </div>

        {/* Actions menu trigger */}
        {!isDoneSection && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuTaskId(menuTaskId === task.id ? null : task.id)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white"
              title="Task options"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {menuTaskId === task.id && (
              <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border border-white/[0.1] bg-[#1a1a1e] py-1 shadow-2xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => openEditForm(task)}
                  className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-zinc-200 hover:bg-white/[0.08]"
                >
                  Edit
                </button>
                {task.repeat_kind !== 'none' && !task.stopped && (
                  <button
                    type="button"
                    onClick={() => handleStopRepeating(task)}
                    className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-amber-300 hover:bg-white/[0.08]"
                  >
                    Stop repeating
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuTaskId(null);
                    setDeleteTarget(task);
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-rose-400 hover:bg-white/[0.08]"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Inner body content
  const panelBody = (
    <div className="space-y-4">
      {/* Action error banner with dismiss button */}
      {actionError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
          <span className="flex-1 min-w-0 pr-2">{actionError}</span>
          <button
            type="button"
            onClick={clearActionError}
            className="shrink-0 text-rose-400 hover:text-white"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-6 text-center text-[13px] text-zinc-500">
          Loading...
        </div>
      )}

      {/* Error state */}
      {!loading && errorMsg && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-300">
          <div>{errorMsg}</div>
          <button
            type="button"
            onClick={loadData}
            className="mt-2 text-xs font-semibold underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitTask}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-zinc-200">
              {editingTask ? 'Edit task' : 'New task'}
            </span>
            <button
              type="button"
              onClick={closeForm}
              className="text-[12px] text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="text-[11px] text-rose-400 leading-tight">{formError}</div>
          )}

          {/* Title */}
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>Title *</span>
              <span>{200 - formTitle.length} left</span>
            </div>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="What needs to be done?"
              maxLength={200}
              required
              className={inputBase}
              autoFocus
            />
          </div>

          {/* Note */}
          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>Note (optional)</span>
              <span>{1000 - formNote.length}</span>
            </div>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Details or links..."
              rows={2}
              maxLength={1000}
              className={inputBase}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                Date {formRepeatKind !== 'none' ? '*' : ''}
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => {
                  setFormDueDate(e.target.value);
                  if (!e.target.value) setFormDueTime('');
                }}
                className={inputBase}
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Time</label>
              <input
                type="time"
                value={formDueTime}
                onChange={(e) => setFormDueTime(e.target.value)}
                disabled={!formDueDate}
                className={inputBase}
              />
            </div>
          </div>

          {/* Content ID */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              Content ID (optional)
            </label>
            <input
              type="text"
              value={formContentId}
              onChange={(e) => setFormContentId(e.target.value)}
              placeholder="e.g. WAVECON-20261122_0001"
              maxLength={60}
              className={inputBase}
            />
          </div>

          {/* Repeat Kind */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Repeat</label>
            <select
              value={formRepeatKind}
              onChange={(e) => setFormRepeatKind(e.target.value)}
              className={inputBase}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>

          {/* Repeat Kind options */}
          {formRepeatKind === 'daily' && (
            <label className="flex items-center gap-2 text-[12px] text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formSkipFriday}
                onChange={(e) => setFormSkipFriday(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-sky-500"
              />
              <span>Skip Fridays</span>
            </label>
          )}

          {formRepeatKind === 'weekly' && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">
                Repeat on (week starts Saturday) *
              </label>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((w) => {
                  const sel = formWeekdays.includes(w.val);
                  return (
                    <button
                      key={w.val}
                      type="button"
                      onClick={() => handleWeekdayToggle(w.val)}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition ${
                        sel
                          ? 'bg-sky-500 text-black font-semibold'
                          : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {formRepeatKind === 'monthly' && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                Day of month (1-31) *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={formMonthDay}
                onChange={(e) => setFormMonthDay(e.target.value)}
                className={inputBase}
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className={`${btnGhost} text-[12px] py-1.5 px-3`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formBusy}
              className={`${btnPrimary} text-[12px] py-1.5 px-4`}
            >
              {formBusy ? 'Saving...' : editingTask ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      )}

      {/* Main Sections */}
      {!loading && !errorMsg && (
        <>
          {/* Section 1: Pending now (Overdue + Today) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Pending now ({pendingCount})
              </span>
              {!showForm && (
                <button
                  type="button"
                  onClick={openNewForm}
                  className="text-[11px] font-medium text-sky-400 hover:underline hover:text-sky-300"
                >
                  + Add task
                </button>
              )}
            </div>

            {pendingCount === 0 ? (
              <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] py-4 text-center text-[12px] text-zinc-500">
                Nothing for today.
              </div>
            ) : (
              <div className="space-y-1.5">
                {panelData.overdue.map((item) => renderRow(item, false))}
                {panelData.today.map((item) => renderRow(item, false))}
              </div>
            )}
          </div>

          {/* Section 2: Later */}
          {(panelData.later.length > 0 || panelData.laterHiddenCount > 0) && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Later
              </div>
              <div className="space-y-1.5">
                {panelData.later.map((item) => renderRow(item, false))}
                {panelData.laterHiddenCount > 0 && (
                  <div className="pt-1 text-center text-[11px] text-zinc-500">
                    +{panelData.laterHiddenCount} more later
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Done today */}
          {panelData.doneToday.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Done today ({panelData.doneToday.length})
              </div>
              <div className="space-y-1.5">
                {panelData.doneToday.map((item) => renderRow(item, true))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {collapsible ? (
        <div className={`rounded-2xl border border-white/[0.08] bg-[#121215] overflow-hidden ${className}`}>
          {/* Header Bar */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-semibold text-zinc-100">
                Today&apos;s work
              </span>
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-400">
                {pendingCount} pending
              </span>
              <span className="hidden sm:inline text-[12px] text-zinc-500">
                · {formatHeaderDate(todayDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-zinc-400">
                {collapsed ? 'Expand' : 'Collapse'}
              </span>
              <svg
                className={`h-4 w-4 text-zinc-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {!collapsed && (
            <div className="border-t border-white/[0.06] p-4">
              {panelBody}
            </div>
          )}
        </div>
      ) : (
        <div className={`rounded-2xl border border-white/[0.08] bg-[#121215] p-4 ${className}`}>
          {/* Static Header */}
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-[15px] font-semibold text-zinc-100">
                Today&apos;s work
              </h2>
              <p className="text-[11px] text-zinc-500">
                {formatHeaderDate(todayDate)}
              </p>
            </div>
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-400">
              {pendingCount} pending
            </span>
          </div>
          {panelBody}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${deleteTarget.title}"?`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
