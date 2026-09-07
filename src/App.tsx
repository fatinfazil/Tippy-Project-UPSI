/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { StoryPlayer } from './components/story/StoryPlayer';
import { HomeLandingPage } from './pwa/HomeLandingPage';
import { InstallPage } from './pwa/InstallPage';
import { InvalidUrlPage } from './pwa/InvalidUrlPage';
import { LaunchPage } from './pwa/LaunchPage';
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  fetchAppStatus,
  stripBypassQuery,
} from './pwa/maintenance';
import { MaintenancePage } from './pwa/MaintenancePage';
import { ParentChildFormPage } from './pwa/ParentChildFormPage';
import { ParentPortalPage } from './pwa/ParentPortalPage';
import { isStandaloneDisplay } from './pwa/identity';
import { parseRoute } from './pwa/routes';

const STATUS_POLL_MS = 60_000;

export default function App() {
  // Routes are read once per load; /launch redirects with a full navigation.
  const [route] = useState(() => parseRoute());
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    DEFAULT_MAINTENANCE_MESSAGE,
  );

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      void fetchAppStatus().then((status) => {
        if (cancelled) return;
        setMaintenance(status.maintenance);
        setMaintenanceMessage(status.message);
        if (!status.maintenance) stripBypassQuery();
      });
    };

    check();

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) check();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    const interval = window.setInterval(check, STATUS_POLL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
      window.clearInterval(interval);
    };
  }, []);

  if (maintenance === null) {
    return <div className="min-h-screen min-h-[100dvh] bg-slate-950" />;
  }

  if (maintenance) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  if (route.kind === 'home') {
    return <HomeLandingPage />;
  }

  if (route.kind === 'invalid') {
    return <InvalidUrlPage />;
  }

  if (route.kind === 'launch') {
    return <LaunchPage userId={route.userId} />;
  }

  if (route.kind === 'install') {
    // Some iOS versions pin the page URL rather than the manifest start_url,
    // so an icon can land here. Installed means the child, not the parent:
    // treat it as a launch instead of showing setup instructions.
    return isStandaloneDisplay() ? (
      <LaunchPage userId={route.userId} />
    ) : (
      <InstallPage userId={route.userId} />
    );
  }

  if (route.kind === 'parent') {
    if (route.view === 'child-new') {
      return <ParentChildFormPage mode="new" />;
    }
    if (route.view === 'child-edit') {
      return <ParentChildFormPage mode="edit" childId={route.childId} />;
    }
    return <ParentPortalPage />;
  }

  if (route.kind === 'play') {
    return <StoryPlayer accessCode={route.accessCode} />;
  }

  return <InvalidUrlPage />;
}

