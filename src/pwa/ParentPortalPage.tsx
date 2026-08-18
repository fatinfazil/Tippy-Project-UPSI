import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteParentChild,
  deleteParentMe,
  fetchParentChildren,
  fetchParentMe,
  logoutParent,
  startParentLogin,
  updateParentMe,
  verifyParentLogin,
  type ParentChild,
  type ParentMe,
} from '../config/parentApi';
import {
  PARENT_CHILD_NEW_PATH,
  parentChildEditPath,
} from './routes';
import { installPathFor } from './userId';

type Step = 'loading' | 'login' | 'code' | 'dashboard';

const fieldClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400';

/** One child account per page so parents can step with Next / Previous. */
const CHILDREN_PAGE_SIZE = 1;

export const ParentPortalPage: React.FC = () => {
  const [step, setStep] = useState<Step>('loading');
  const [me, setMe] = useState<ParentMe | null>(null);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [nonce, setNonce] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingParent, setEditingParent] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [parentFullName, setParentFullName] = useState('');
  const [childPage, setChildPage] = useState(0);

  const childPageCount = Math.max(1, Math.ceil(children.length / CHILDREN_PAGE_SIZE));
  const pagedChildren = useMemo(() => {
    const start = childPage * CHILDREN_PAGE_SIZE;
    return children.slice(start, start + CHILDREN_PAGE_SIZE);
  }, [children, childPage]);

  useEffect(() => {
    setChildPage((page) => Math.min(page, Math.max(0, childPageCount - 1)));
  }, [childPageCount]);

  const loadDashboard = useCallback(async () => {
    const profile = await fetchParentMe();
    if (!profile) {
      setMe(null);
      setStep('login');
      return;
    }
    const list = await fetchParentChildren();
    setMe(profile);
    setChildren(list);
    setParentName(profile.guardian?.name ?? '');
    setParentContact(profile.guardian?.contact ?? '');
    setParentFullName(profile.guardian?.fullName ?? '');
    setStep('dashboard');
  }, []);

  useEffect(() => {
    void loadDashboard().catch(() => {
      setStep('login');
    });
  }, [loadDashboard]);

  const onStartLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const started = await startParentLogin();
      setNonce(started.nonce);
      setDeepLink(started.deepLink);
      setCode('');
      setStep('code');
      window.open(started.deepLink, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start login');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nonce) return;
    setError(null);
    setBusy(true);
    try {
      await verifyParentLogin(nonce, code);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify code');
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await logoutParent();
      setMe(null);
      setChildren([]);
      setNonce(null);
      setDeepLink(null);
      setEditingParent(false);
      setStep('login');
    } finally {
      setBusy(false);
    }
  };

  const onSaveParent = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const updated = await updateParentMe({
        name: parentName,
        contact: parentContact,
        fullName: parentFullName,
      });
      setMe(updated);
      setEditingParent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update parent info');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteParent = async () => {
    const confirmed = window.confirm(
      'Delete this parent account? This removes your guardian profile and all children accounts linked here. This cannot be undone.',
    );
    if (!confirmed) return;
    setError(null);
    setBusy(true);
    try {
      await deleteParentMe();
      setMe(null);
      setChildren([]);
      setEditingParent(false);
      setStep('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteChild = async (child: ParentChild) => {
    const confirmed = window.confirm(
      `Delete children account “${child.nickname}”? Their Tippy install link will stop working.`,
    );
    if (!confirmed) return;
    setError(null);
    setBusy(true);
    try {
      await deleteParentChild(child.id);
      setChildren((prev) => prev.filter((c) => c.id !== child.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete child');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-emerald-400 text-sm font-semibold tracking-wide">
          Tippy Wira Hijau
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Parent portal</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Log in with Telegram, then manage this account and children accounts.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        {step === 'loading' && (
          <p className="mt-8 text-slate-400">Checking your session…</p>
        )}

        {step === 'login' && (
          <div className="mt-8 space-y-4">
            <p className="text-slate-300 text-sm">
              We will open Tippy’s Telegram bot and send you a 4-digit code.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onStartLogin()}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? 'Starting…' : 'Login with Telegram'}
            </button>
          </div>
        )}

        {step === 'code' && (
          <form className="mt-8 space-y-4" onSubmit={(e) => void onVerify(e)}>
            <p className="text-slate-300 text-sm">
              1. Open Telegram (button below if it did not open).
              <br />
              2. Tap Start on the bot.
              <br />
              3. Enter the 4-digit code Tippy sends you.
            </p>
            {deepLink && (
              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-emerald-400 underline text-sm"
              >
                Open Telegram bot again
              </a>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              pattern="\d{4}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit code"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={busy || code.length !== 4}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? 'Checking…' : 'Confirm code'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep('login');
                setNonce(null);
                setDeepLink(null);
                setCode('');
                setError(null);
              }}
              className="w-full text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </form>
        )}

        {step === 'dashboard' && me && (
          <div className="mt-8 space-y-8">
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">This account</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Telegram chat {me.chatId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Log out
                </button>
              </div>

              {!editingParent ? (
                <div className="mt-4 space-y-2">
                  <p className="text-white font-medium">
                    {me.guardian?.fullName || me.guardian?.name || 'No parent info yet'}
                  </p>
                  {me.guardian && (
                    <p className="text-sm text-slate-400">
                      {me.guardian.name} · {me.guardian.contact}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setParentName(me.guardian?.name ?? '');
                        setParentContact(me.guardian?.contact ?? '');
                        setParentFullName(me.guardian?.fullName ?? '');
                        setEditingParent(true);
                      }}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onDeleteParent()}
                      className="rounded-lg border border-rose-500/50 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10"
                    >
                      Delete this account
                    </button>
                  </div>
                </div>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={(e) => void onSaveParent(e)}>
                  <input
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Guardian name"
                    className={fieldClass}
                  />
                  <input
                    required
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    placeholder="Contact"
                    className={fieldClass}
                  />
                  <input
                    required
                    value={parentFullName}
                    onChange={(e) => setParentFullName(e.target.value)}
                    placeholder="Full name"
                    className={fieldClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingParent(false)}
                      className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Children Account</h2>
                {children.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {children.length} total
                  </p>
                )}
              </div>
              {children.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No children accounts yet.</p>
              ) : (
                <>
                  <ul className="mt-3 space-y-3">
                    {pagedChildren.map((child) => (
                      <li
                        key={child.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                      >
                        <p className="font-medium text-white">{child.nickname}</p>
                        <p className="text-sm text-slate-400">
                          {child.school} · Class {child.class_name}
                        </p>
                        {child.access_code && (
                          <p className="mt-2 text-sm">
                            Install link:{' '}
                            <a
                              className="text-emerald-400 underline"
                              href={installPathFor(child.access_code)}
                            >
                              /u/{child.access_code}
                            </a>
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href={parentChildEditPath(child.id)}
                            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-400"
                          >
                            Edit
                          </a>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onDeleteChild(child)}
                            className="rounded-lg border border-rose-500/50 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {children.length > 0 && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={busy || childPage <= 0}
                        onClick={() => setChildPage((page) => Math.max(0, page - 1))}
                        className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <p className="text-sm text-slate-400">
                        Kid {childPage + 1} of {children.length}
                      </p>
                      <button
                        type="button"
                        disabled={busy || childPage >= childPageCount - 1}
                        onClick={() =>
                          setChildPage((page) =>
                            Math.min(childPageCount - 1, page + 1),
                          )
                        }
                        className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}

              <a
                href={PARENT_CHILD_NEW_PATH}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Add children account
              </a>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
