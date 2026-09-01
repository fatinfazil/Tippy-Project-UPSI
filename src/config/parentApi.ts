export type ParentChild = {
  id: number;
  nickname: string;
  full_name: string | null;
  school: string;
  class_name: string;
  access_code: string | null;
};

export type ParentMe = {
  chatId: string;
  guardian: {
    name: string;
    contact: string;
    fullName: string;
  } | null;
};

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Request failed (${res.status})`,
    );
  }
  return data;
}

export async function startParentLogin(): Promise<{
  nonce: string;
  deepLink: string;
  expiresAt: string;
  botUsername: string;
}> {
  const res = await fetch('/api/parent/login/start', {
    method: 'POST',
    credentials: 'include',
  });
  return readJson(res);
}

export async function verifyParentLogin(
  nonce: string,
  code: string,
): Promise<{ ok: true; chatId: string }> {
  const res = await fetch('/api/parent/login/verify', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce, code }),
  });
  return readJson(res);
}

export async function logoutParent(): Promise<void> {
  await fetch('/api/parent/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchParentMe(): Promise<ParentMe | null> {
  const res = await fetch('/api/parent/me', { credentials: 'include' });
  if (res.status === 401) return null;
  return readJson(res);
}

export async function updateParentMe(input: {
  name: string;
  contact: string;
  fullName: string;
}): Promise<ParentMe> {
  const res = await fetch('/api/parent/me', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return readJson(res);
}

export async function deleteParentMe(): Promise<void> {
  const res = await fetch('/api/parent/me', {
    method: 'DELETE',
    credentials: 'include',
  });
  await readJson(res);
}

export async function fetchParentChildren(): Promise<ParentChild[]> {
  const res = await fetch('/api/parent/children', { credentials: 'include' });
  const data = await readJson<{ children: ParentChild[] }>(res);
  return data.children;
}

export async function createParentChild(input: {
  nickname: string;
  fullName?: string;
  school: string;
  className: string;
}): Promise<ParentChild> {
  const res = await fetch('/api/parent/children', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ child: ParentChild }>(res);
  return data.child;
}

export async function updateParentChild(
  id: number,
  input: {
    nickname: string;
    fullName?: string;
    school: string;
    className: string;
  },
): Promise<ParentChild> {
  const res = await fetch(`/api/parent/children/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ child: ParentChild }>(res);
  return data.child;
}

export async function deleteParentChild(id: number): Promise<void> {
  const res = await fetch(`/api/parent/children/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await readJson(res);
}
