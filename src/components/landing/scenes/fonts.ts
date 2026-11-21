import { Great_Vibes, Noto_Serif } from 'next/font/google';

/**
 * Faces the scenes need that the root layout does not load:
 * - Noto Serif: the NDA document face (the template loads it from Google Fonts inside its own
 *   iframe/PDF; the app shell never loads it). Used only inside document sheets.
 * - Great Vibes: the typed-signature face, loaded the same way as the receiver sign page.
 * next/font self-hosts both, so no new dependency and no third-party request at runtime.
 */
export const notoSerif = Noto_Serif({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' });

export const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', display: 'swap' });
