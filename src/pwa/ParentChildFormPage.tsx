import React, { useEffect, useState } from 'react';
import {
  createParentChild,
  fetchParentChildren,
  fetchParentMe,
  updateParentChild,
} from '../config/parentApi';
import { PARENT_HOME_PATH } from './routes';

const fieldClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400';

type ParentChildFormPageProps =
  | { mode: 'new' }
  | { mode: 'edit'; childId: number };

export const ParentChildFormPage: React.FC<ParentChildFormPageProps> = (
  props,
) => {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetchParentMe();
        if (!me) {
          window.location.replace(PARENT_HOME_PATH);
          return;
        }
        if (props.mode === 'edit') {
          const list = await fetchParentChildren();
          const child = list.find((c) => c.id === props.childId);
          if (!child) {
            setError('Child account not found.');
            setReady(true);
            return;
          }
          if (cancelled) return;
          setNickname(child.nickname);
          setFullName(child.full_name ?? '');
          setSchool(child.school);
          setClassName(child.class_name);
        }
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setError('Could not load form.');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props]);

  const goHome = () => {
    window.location.assign(PARENT_HOME_PATH);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (props.mode === 'new') {
        await createParentChild({
          nickname,
          fullName: fullName.trim() || undefined,
          school,
          className,
        });
      } else {
        await updateParentChild(props.childId, {
          nickname,
          fullName: fullName.trim() || undefined,
          school,
          className,
        });
      }
      goHome();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : props.mode === 'new'
            ? 'Could not add child'
            : 'Could not update child',
      );
      setBusy(false);
    }
  };

  const title =
    props.mode === 'new' ? 'Add children account' : 'Edit children account';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-emerald-400 text-sm font-semibold tracking-wide">
          Tippy Wira Hijau
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Nickname, school, and class are required. Full name is optional.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        {!ready ? (
          <p className="mt-8 text-slate-400">Loading…</p>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={(e) => void onSubmit(e)}>
            <input
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
              className={fieldClass}
            />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name (optional)"
              className={fieldClass}
            />
            <input
              required
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="School"
              className={fieldClass}
            />
            <input
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Class"
              className={fieldClass}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy
                ? 'Saving…'
                : props.mode === 'new'
                  ? 'Save child account'
                  : 'Save changes'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={goHome}
              className="w-full text-sm text-slate-400 hover:text-slate-200"
            >
              Back to parent portal
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
