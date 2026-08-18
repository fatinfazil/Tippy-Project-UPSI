import React, { useEffect } from 'react';
import { StoryPlayer } from '../components/story/StoryPlayer';
import { rememberLaunch } from './identity';
import { playPathFor } from './userId';

interface LaunchPageProps {
  /** null when the installed icon carries a malformed id. */
  userId: string | null;
}

/**
 * The manifest start_url. Stores the id, then shows StoryPlayer on this same
 * load so "Getting Tippy ready..." can download videos and art instead of
 * bouncing through a second navigation.
 *
 * URL is rewritten to /play/{access_code} so the child identity stays in the
 * path — multiple Home Screen icons share localStorage on the same origin.
 */
export const LaunchPage: React.FC<LaunchPageProps> = ({ userId }) => {
  // Must run during render: StoryPlayer reads localStorage on first paint.
  if (userId) rememberLaunch(userId);

  useEffect(() => {
    if (!userId) return;
    const target = playPathFor(userId);
    if (window.location.pathname !== target) {
      window.history.replaceState(null, '', target);
    }
  }, [userId]);

  return <StoryPlayer accessCode={userId} />;
};
