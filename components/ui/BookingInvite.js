'use client';

import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { ModalShell, ConfirmDialog, btnPrimary, btnGhost, inputBase } from './Shared';
import { canManageExternals } from '../../lib/core';

export const BookingsContext = createContext({ bookings: [] });

export function useContentBookings(contentId) {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!contentId) {
      setBookings([]);
      return undefined;
    }

    let active = true;

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, content_id, member_id, role_field, starts_at, place, note, expires_at, status, answered_at, invited_by, created_at, updated_at')
          .eq('content_id', contentId)
          .order('created_at', { ascending: false });

        if (error) return;
        if (active && data) {
          setBookings(data);
        }
      } catch {
        // ignore
      }
    };

    fetchBookings();

    const channel = supabase
      .channel('bookings-' + contentId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `content_id=eq.${contentId}` },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [contentId]);

  return bookings;
}

export function latestBookingFor(bookings, field, memberId) {
  if (!Array.isArray(bookings) || !field || !memberId) return null;
  return (
    bookings.find(
      (b) =>
        b.role_field === field &&
        String(b.member_id) === String(memberId) &&
        (b.status === 'sent' || b.status === 'confirmed' || b.status === 'declined')
    ) || null
  );
}

export function BookingBadge({ booking }) {
  if (!booking) return null;
  const isExpired = booking.status === 'sent' && new Date(booking.expires_at) <= new Date();

  let text = '';
  let colorCls = '';

  if (booking.status === 'sent') {
    if (isExpired) {
      text = 'Expired';
      colorCls = 'border-zinc-700 bg-zinc-800/40 text-zinc-500';
    } else {
      text = 'Link created';
      colorCls = 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300';
    }
  } else if (booking.status === 'confirmed') {
    text = 'Confirmed';
    colorCls = 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';
  } else if (booking.status === 'declined') {
    text = 'Declined';
    colorCls = 'border-red-500/30 bg-red-500/15 text-red-300';
  } else {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight ${colorCls}`}>
      {text}
    </span>
  );
}

export const ROLE_NAMES_BN = {
  concept_creator: 'কনসেপ্ট ক্রিয়েটর',
  writer: 'স্ক্রিপ্ট রাইটার',
  production_manager: 'প্রোডাকশন ম্যানেজার',
  producer: 'প্রডিউসার',
  presenter_name: 'প্রেজেন্টার',
  set_designer: 'সেট ডিজাইনার',
  camera_operator: 'ক্যামেরা অপারেটর',
  teleprompter_operator: 'টেলিপ্রম্পটার অপারেটর',
  light_designer: 'লাইট ডিজাইনার',
  sound_recordist: 'সাউন্ড রেকর্ডিস্ট',
  data_wrangler: 'ডাটা র্যাংলার',
  makeup_artist: 'মেকআপ আর্টিস্ট',
  voice_over_artist: 'ভয়েস ওভার আর্টিস্ট',
  video_editor: 'ভিডিও এডিটর',
  motion_graphics_designer: 'মোশন গ্রাফিক্স ডিজাইনার',
  graphic_designer: 'গ্রাফিক ডিজাইনার',
  colorist: 'কালারিস্ট',
  audio_mixer: 'অডিও মিক্সার',
  publisher: 'পাবলিশার',
  live_video_switcher: 'লাইভ ভিডিও সুইচার',
  live_audio_mixer: 'লাইভ অডিও মিক্সার',
};

export function buildInviteMessage({ personName, inviterName, startsAtIso, place, note, role_field, label, url }) {
  const d = new Date(startsAtIso);
  const dateFmt = new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeFmt = new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateText = dateFmt.format(d);
  const timeText = timeFmt.format(d);
  const roleBn = ROLE_NAMES_BN[role_field] || label || role_field;

  const lines = [
    `${personName}, ${inviterName}-এর পক্ষ থেকে জানাচ্ছি, ${dateText}, ${timeText}-এ ${place ? place + '-এ ' : ''}${roleBn} হিসেবে আপনাকে প্রয়োজন।`,
  ];
  if (note && note.trim()) {
    lines.push(note.trim());
  }
  if (role_field === 'presenter_name' || role_field === 'voice_over_artist') {
    lines.push('এই লিংকে স্ক্রিপ্টও পাবেন, প্রিন্টও করতে পারবেন।');
  }
  lines.push('আসতে পারবেন কি না নিচের লিংকে জানান:');
  lines.push(url);
  lines.push(`(লিংকটি ${dateText} রাত ১১:৫৯ পর্যন্ত চালু থাকবে)`);
  return lines.join('\n');
}

export function InviteModal({ open, onClose, row, field, label, member, actor }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdToken, setCreatedToken] = useState('');
  const [message, setMessage] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const copyMsgTimer = useRef(null);
  const copyLinkTimer = useRef(null);

  const resetState = useCallback(() => {
    setStep(1);
    setDate('');
    setTime('');
    setPlace('');
    setNote('');
    setBusy(false);
    setError('');
    setCreatedToken('');
    setMessage('');
    setCopiedMsg(false);
    setCopiedLink(false);
    if (copyMsgTimer.current) clearTimeout(copyMsgTimer.current);
    if (copyLinkTimer.current) clearTimeout(copyLinkTimer.current);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, handleClose]);

  if (!open || !member) return null;

  const todayDhaka = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
  const memberDisplayName = member.nickname || member.full_name || 'person';

  const handleCreate = async () => {
    if (!date || !time || busy) return;
    setBusy(true);
    setError('');
    try {
      const safeTime = time.length === 5 ? `${time}:00` : time;
      const startsAt = `${date}T${safeTime}+06:00`;
      const { data: token, error: rpcErr } = await supabase.rpc('create_booking', {
        p_content_id: row.id,
        p_member_id: member.id,
        p_role_field: field,
        p_starts_at: startsAt,
        p_place: place.trim() || null,
        p_note: note.trim() || null,
      });
      if (rpcErr) throw rpcErr;
      if (!token) throw new Error('No secret token returned');

      setCreatedToken(token);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/b/${token}`;
      const msg = buildInviteMessage({
        personName: member.nickname || member.full_name,
        inviterName: actor.nickname || actor.full_name,
        startsAtIso: startsAt,
        place: place.trim(),
        note: note.trim(),
        role_field: field,
        label,
        url,
      });
      setMessage(msg);
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Failed to create booking');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const digits = (member.phone || '').replace(/\D/g, '');
    const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMsg(true);
      if (copyMsgTimer.current) clearTimeout(copyMsgTimer.current);
      copyMsgTimer.current = setTimeout(() => setCopiedMsg(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/b/${createdToken}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      if (copyLinkTimer.current) clearTimeout(copyLinkTimer.current);
      copyLinkTimer.current = setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <ModalShell
      title={step === 1 ? 'Invite Crew Member' : 'Invite Link Created'}
      subtitle={row.slug_name || row.title || ''}
      onClose={handleClose}
      footer={
        step === 1 ? (
          <>
            <button type="button" className={`${btnGhost} min-h-[44px] sm:min-h-0`} onClick={handleClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className={`${btnPrimary} min-h-[44px] sm:min-h-0`}
              disabled={busy || !date || !time}
              onClick={handleCreate}
            >
              {busy ? 'Creating...' : 'Create link'}
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2 w-full">
            <button
              type="button"
              className={`${btnGhost} min-h-[44px] sm:min-h-0`}
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Copied!' : 'Copy link'}
            </button>
            <button
              type="button"
              className={`${btnGhost} min-h-[44px] sm:min-h-0`}
              onClick={handleCopyMessage}
            >
              {copiedMsg ? 'Copied!' : 'Copy message'}
            </button>
            <button
              type="button"
              className="inline-flex min-h-[44px] sm:min-h-0 items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-emerald-400 active:scale-[0.98]"
              onClick={handleOpenWhatsApp}
            >
              Open WhatsApp
            </button>
            <button
              type="button"
              className={`${btnPrimary} min-h-[44px] sm:min-h-0`}
              onClick={handleClose}
            >
              Done
            </button>
          </div>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-4 text-left">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-zinc-300">
            Inviting <span className="font-semibold text-white">{memberDisplayName}</span> as{' '}
            <span className="font-semibold text-sky-400">{label}</span>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12px] font-medium text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                min={todayDhaka}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`${inputBase} w-full`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className={`${inputBase} w-full`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Place <span className="text-zinc-500 font-normal lowercase">(optional, max 300)</span>
            </label>
            <input
              type="text"
              maxLength={300}
              placeholder="e.g. Studio 1 / Location"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className={`${inputBase} w-full`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Note <span className="text-zinc-500 font-normal lowercase">(optional, max 2000)</span>
            </label>
            <textarea
              maxLength={2000}
              rows={3}
              placeholder="Add specific instructions or wardrobe notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputBase} w-full resize-none`}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[12px] font-medium text-amber-200">
            The link code is shown only now. If you close this window, use Invite again to make a new link.
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              WhatsApp Message (editable)
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputBase} w-full resize-y text-[13px] leading-relaxed font-sans`}
            />
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function formatDhakaDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(iso);
  }
}

export function BookingStatusModal({ open, onClose, booking, row, label, member, actor, onInviteAgain }) {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const resetState = useCallback(() => {
    setShowConfirmCancel(false);
    setCancelBusy(false);
    setCancelError('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showConfirmCancel) {
          setShowConfirmCancel(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, handleClose, showConfirmCancel]);

  if (!open || !booking) return null;

  const memberDisplayName = member?.nickname || member?.full_name || 'person';
  const canManage = canManageExternals(actor);

  const isSent = booking.status === 'sent';
  const isExpired = new Date(booking.expires_at) <= new Date();
  const canCancel = canManage && (isSent || ((booking.status === 'confirmed' || booking.status === 'declined') && !isExpired));

  const handleRevoke = async () => {
    setCancelBusy(true);
    setCancelError('');
    try {
      const { error } = await supabase.rpc('revoke_booking', {
        p_booking_id: booking.id,
      });
      if (error) throw error;
      handleClose();
    } catch (err) {
      setCancelError(err?.message || 'Failed to cancel link');
      setShowConfirmCancel(false);
    } finally {
      setCancelBusy(false);
    }
  };

  const handleInviteAgain = () => {
    handleClose();
    onInviteAgain();
  };

  return (
    <>
      <ModalShell
        title="Booking Status"
        subtitle={row.slug_name || row.title || ''}
        onClose={handleClose}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div>
              {canCancel ? (
                <button
                  type="button"
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-[12px] font-semibold text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  Cancel link
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <button
                  type="button"
                  className={`${btnPrimary} min-h-[44px] sm:min-h-0`}
                  onClick={handleInviteAgain}
                >
                  Invite again
                </button>
              ) : null}
              <button
                type="button"
                className={`${btnGhost} min-h-[44px] sm:min-h-0`}
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 text-left text-[13px]">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5">
            <div>
              <span className="font-semibold text-white">{memberDisplayName}</span>
              <span className="text-zinc-500 mx-1.5">·</span>
              <span className="text-zinc-400">{label}</span>
            </div>
            <BookingBadge booking={booking} />
          </div>

          {cancelError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12px] font-medium text-red-300">
              {cancelError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Call Time (Starts at)</div>
              <div className="font-medium text-white">{formatDhakaDateTime(booking.starts_at)}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Link Expires</div>
              <div className="font-medium text-zinc-300">{formatDhakaDateTime(booking.expires_at)}</div>
            </div>
          </div>

          {booking.place ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Place</div>
              <div className="font-medium text-white">{booking.place}</div>
            </div>
          ) : null}

          {booking.note ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Note</div>
              <div className="text-zinc-300 whitespace-pre-wrap">{booking.note}</div>
            </div>
          ) : null}

          {(booking.status === 'confirmed' || booking.status === 'declined') && booking.answered_at ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Answered At</div>
              <div className="font-medium text-zinc-300">{formatDhakaDateTime(booking.answered_at)}</div>
            </div>
          ) : null}
        </div>
      </ModalShell>

      {showConfirmCancel ? (
        <ConfirmDialog
          title="Cancel this link?"
          message="The person will no longer be able to open it."
          danger
          confirmLabel={cancelBusy ? 'Cancelling...' : 'Cancel link'}
          onConfirm={handleRevoke}
          onCancel={() => {
            if (!cancelBusy) setShowConfirmCancel(false);
          }}
        />
      ) : null}
    </>
  );
}
