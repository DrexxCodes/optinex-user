// Avatar generation — Dicebear `micah` style, seeded with the user's email so
// the same account always renders the same avatar without storing image bytes.
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

export function generateAvatarDataUri(seedEmail: string): string {
  const avatar = createAvatar(micah, {
    seed: seedEmail.trim().toLowerCase(),
    backgroundColor: ['1C54F5', 'EAF1FF', '4FD1F5']
  });
  return avatar.toDataUri();
}

// Raw SVG markup for a seed — used by the /api/avatar/[seed] route so the
// image is rendered by our own server instead of fetched from Dicebear's API.
export function generateAvatarSvg(seedEmail: string): string {
  const avatar = createAvatar(micah, {
    seed: seedEmail.trim().toLowerCase(),
    backgroundColor: ['1C54F5', 'EAF1FF', '4FD1F5']
  });
  return avatar.toString();
}

// Path (not a remote URL) the client renders in an <Image>/<img> src.
export function avatarPath(seedEmail: string): string {
  const seed = encodeURIComponent(seedEmail.trim().toLowerCase());
  return `/api/avatar/${seed}`;
}
