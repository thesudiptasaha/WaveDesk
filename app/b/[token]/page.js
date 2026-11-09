'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { supabase } from '../../../services/supabase';
import { ROLE_NAMES_BN } from '../../../components/ui/BookingInvite';
import { scriptToHtml, sanitizeScriptHtml } from '../../../utils/scriptRich';
import { ScriptPrintDocument } from '../../../components/ui/ScriptPrint';

const CALM_MESSAGES = {
  invalid: 'এই লিংকটি সঠিক নয়। আমন্ত্রণকারীর সাথে যোগাযোগ করুন।',
  revoked: 'এই আমন্ত্রণটি বাতিল করা হয়েছে।',
  replaced: 'এই লিংকের বদলে নতুন লিংক পাঠানো হয়েছে। নতুন লিংকটি ব্যবহার করুন।',
  expired: 'এই লিংকের মেয়াদ শেষ হয়ে গেছে।',
};

function formatBanglaDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('bn-BD', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function formatBanglaTime(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('bn-BD', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function BookingPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : Array.isArray(params?.token) ? params.token[0] : '';

  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [state, setState] = useState(null); // 'invalid' | 'revoked' | 'replaced' | 'expired' | 'ok'
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState(null); // 'sent' | 'confirmed' | 'declined'
  const [answering, setAnswering] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [printing, setPrinting] = useState(false);

  const printedRef = useRef(false);

  useEffect(() => {
    if (!printing) {
      printedRef.current = false;
      return undefined;
    }

    if (printedRef.current) return undefined;
    printedRef.current = true;

    const handleAfterPrint = () => {
      setPrinting(false);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    let hasRun = false;
    let rafId2 = null;
    const rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        hasRun = true;
        window.print();
      });
    });

    return () => {
      if (!hasRun) {
        printedRef.current = false;
      }
      cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printing]);

  const fetchBooking = useCallback(async (mountedRef) => {
    if (!token || !supabase) {
      if (mountedRef.current) {
        setLoading(false);
        setNetworkError(!supabase);
        setState(!supabase ? null : 'invalid');
      }
      return;
    }

    setLoading(true);
    setNetworkError(false);
    setAnswerError('');

    try {
      const { data, error } = await supabase.rpc('get_booking_by_token', { p_token: token });
      if (!mountedRef.current) return;

      if (error) {
        setNetworkError(true);
        setLoading(false);
        return;
      }

      if (!data || !data.state) {
        setState('invalid');
        setLoading(false);
        return;
      }

      setState(data.state);
      if (data.state === 'ok') {
        setBooking(data);
        setStatus(data.status);
      }
    } catch {
      if (mountedRef.current) {
        setNetworkError(true);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    const mountedRef = { current: true };
    fetchBooking(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchBooking]);

  const rawScript = booking?.script || '';
  const hasScript = Boolean(rawScript.trim());
  const sanitizedScriptHtml = useMemo(() => {
    if (!hasScript) return '';
    return sanitizeScriptHtml(scriptToHtml(rawScript));
  }, [rawScript, hasScript]);

  const handleAnswer = async (newAnswer) => {
    if (answering || !token || !supabase) return;
    setAnswering(true);
    setAnswerError('');

    try {
      const { data, error } = await supabase.rpc('answer_booking', {
        p_token: token,
        p_answer: newAnswer,
      });

      if (error) {
        setAnswerError('উত্তর পাঠানো যায়নি, আবার চেষ্টা করুন');
        return;
      }

      if (!data || !data.state) {
        setAnswerError('উত্তর পাঠানো যায়নি, আবার চেষ্টা করুন');
        return;
      }

      if (data.state === 'ok') {
        setStatus(data.status || newAnswer);
      } else {
        setState(data.state);
      }
    } catch {
      setAnswerError('উত্তর পাঠানো যায়নি, আবার চেষ্টা করুন');
    } finally {
      setAnswering(false);
    }
  };

  const roleName = (booking?.role_field && ROLE_NAMES_BN[booking.role_field]) || booking?.role_field || '';

  let statusLineText = '';
  if (status === 'sent') {
    statusLineText = 'এখনও উত্তর দেননি';
  } else if (status === 'confirmed') {
    statusLineText = 'আপনার উত্তর: আসতে পারবেন';
  } else if (status === 'declined') {
    statusLineText = 'আপনার উত্তর: আসতে পারবেন না';
  }

  // --- Render Loading ---
  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-3">
          <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-2">WaveDesk</div>
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-[13px] text-zinc-400">লোড হচ্ছে...</p>
        </div>
      </main>
    );
  }

  // --- Render Network Error ---
  if (networkError) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">WaveDesk</div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-4 shadow-xl">
            <p className="text-[14px] text-zinc-300">তথ্য লোড করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।</p>
            <button
              type="button"
              onClick={() => fetchBooking({ current: true })}
              className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[14px] font-semibold transition active:scale-[0.98] cursor-pointer"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- Render Calm Card for Non-OK States ---
  if (state !== 'ok' || !booking) {
    const calmMsg = (state && CALM_MESSAGES[state]) || CALM_MESSAGES.invalid;
    return (
      <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-3">
          <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">WaveDesk</div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 sm:p-8 space-y-2 shadow-xl">
            <p className="text-[15px] font-medium text-zinc-300 leading-relaxed">
              {calmMsg}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --- Render State OK ---
  return (
    <>
      {/* Scoped styling for screen script preview */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .booking-script-content p {
              margin-bottom: 0.75rem;
            }
            .booking-script-content p:last-child {
              margin-bottom: 0;
            }
            .booking-script-content mark {
              background-color: rgba(250, 204, 21, 0.35);
              color: #fef08a;
              padding: 0 2px;
              border-radius: 2px;
            }
            .booking-script-content u {
              text-underline-offset: 3px;
            }
          `,
        }}
      />

      {/* Screen container */}
      <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-start p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5 py-6 sm:py-8">
          {/* Top Label */}
          <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 text-center">
            WaveDesk
          </div>

          {/* Heading */}
          <h1 className="text-[20px] sm:text-[22px] font-bold text-white text-center tracking-tight">
            {booking.person_name}, আপনাকে প্রয়োজন
          </h1>

          {/* Details Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 sm:p-6 space-y-3.5 text-left shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">ভূমিকা</span>
              <span className="text-[15px] font-semibold text-sky-400">{roleName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">তারিখ</span>
              <span className="text-[14px] font-medium text-zinc-100">{formatBanglaDate(booking.starts_at)}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">সময়</span>
              <span className="text-[14px] font-medium text-zinc-100">{formatBanglaTime(booking.starts_at)}</span>
            </div>

            {booking.place ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">স্থান</span>
                <span className="text-[14px] font-medium text-zinc-100">{booking.place}</span>
              </div>
            ) : null}

            {booking.channel ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">চ্যানেল</span>
                <span className="text-[14px] font-medium text-zinc-100">{booking.channel}</span>
              </div>
            ) : null}

            {booking.note ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-t border-white/[0.06] pt-3">
                <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">নোট</span>
                <span className="text-[14px] text-zinc-200 whitespace-pre-wrap leading-relaxed">{booking.note}</span>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-t border-white/[0.06] pt-3">
              <span className="text-[12px] font-medium text-zinc-400 sm:w-24 shrink-0">আমন্ত্রণকারী</span>
              <div className="text-[14px] font-medium text-zinc-100 flex flex-wrap items-center gap-2">
                <span>{booking.invited_by_name}</span>
                {booking.invited_by_phone ? (
                  <a
                    href={`tel:${booking.invited_by_phone}`}
                    className="inline-flex items-center gap-1 text-[13px] text-sky-400 hover:text-sky-300 underline underline-offset-2 min-h-[36px] py-1"
                  >
                    {booking.invited_by_phone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Response Actions Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 sm:p-6 space-y-4 shadow-lg text-left">
            <div className="flex items-center justify-between px-1 text-[13px]">
              <span className="text-zinc-400">স্ট্যাটাস</span>
              <span
                className={`font-semibold ${
                  status === 'confirmed'
                    ? 'text-emerald-400'
                    : status === 'declined'
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }`}
              >
                {statusLineText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={answering}
                onClick={() => handleAnswer('confirmed')}
                className={`min-h-[48px] w-full px-4 py-3 rounded-2xl font-semibold text-[15px] transition flex items-center justify-center gap-2 border active:scale-[0.98] ${
                  status === 'confirmed'
                    ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                } ${answering ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>✓</span> আসতে পারব
              </button>

              <button
                type="button"
                disabled={answering}
                onClick={() => handleAnswer('declined')}
                className={`min-h-[48px] w-full px-4 py-3 rounded-2xl font-semibold text-[15px] transition flex items-center justify-center gap-2 border active:scale-[0.98] ${
                  status === 'declined'
                    ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-400/50'
                    : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                } ${answering ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>✗</span> আসতে পারব না
              </button>
            </div>

            {answerError ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-center text-[13px] font-medium text-red-300">
                {answerError}
              </div>
            ) : null}
          </div>

          {/* Footer Line */}
          <p className="text-[12px] text-zinc-500 text-center leading-relaxed px-2">
            এই লিংকটি {formatBanglaDate(booking.expires_at)} রাত ১১:৫৯ পর্যন্ত চালু থাকবে
          </p>

          {/* Script Section (Only if show_script is true) */}
          {booking.show_script ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 sm:p-6 space-y-4 text-left shadow-lg">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h2 className="text-[15px] font-semibold text-white">স্ক্রিপ্ট</h2>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 font-serif">
                {hasScript ? (
                  <article
                    className="booking-script-content text-[15px] leading-relaxed text-zinc-200"
                    dangerouslySetInnerHTML={{ __html: sanitizedScriptHtml }}
                  />
                ) : (
                  <p className="text-[13px] text-zinc-500 italic py-4 text-center font-sans">
                    স্ক্রিপ্ট এখনও যোগ করা হয়নি।
                  </p>
                )}
              </div>

              {hasScript ? (
                <div className="pt-2 border-t border-white/[0.06] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPrinting(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[13px] font-semibold transition active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    প্রিন্ট করুন
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>

      {printing && typeof document !== 'undefined' && booking.show_script ? (
        createPortal(
          <ScriptPrintDocument
            mode="public"
            row={{ content_uid: booking.content_uid }}
            script={booking.script}
          />,
          document.body
        )
      ) : null}
    </>
  );
}

