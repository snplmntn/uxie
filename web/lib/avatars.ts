import type { AvatarId } from './types'

// Names and taglines mirror avatars/2026-10-25-uxie-avatars.json (the repo's roster); the rest is UI dressing.
export const ORDER: AvatarId[] = ['lola', 'mika', 'ava', 'dev', 'grace']
export const DEFAULT_SEL: AvatarId[] = ['lola', 'mika', 'dev']

export type Variant = 'desktop' | 'zoom' | 'mobile' | 'tree'
export type AvatarMeta = {
  name: string; who: string; tag: string; changes: string; cfg: string
  variant: Variant; ink: string; soft: string; group: string; pace: number
}

export const AV: Record<AvatarId, AvatarMeta> = {
  lola: { name: 'Lola', who: '71 · retired teacher, low vision', tag: 'Reads every word, misses the small ones.', changes: '200% zoom · reduced motion', cfg: '1280×800 · 200% zoom', variant: 'zoom', ink: '#7E22CE', soft: '#F6EEFF', group: 'low-vision', pace: 1.35 },
  mika: { name: 'Mika', who: '24 · first visit, on a commute', tag: 'Thumbs only, zero patience for pinching.', changes: 'iPhone 15 · touch only · no hover', cfg: 'iPhone 15 · touch only', variant: 'mobile', ink: '#DB2777', soft: '#FDEEF6', group: 'mobile', pace: 0.95 },
  ava: { name: 'Ava', who: '36 · blind, keyboard and screen reader', tag: 'If it’s not in the tree or keyboard path, I can’t use it.', changes: 'Keyboard only · accessibility tree, no screenshots', cfg: 'Keyboard · a11y tree', variant: 'tree', ink: '#A21CAF', soft: '#FCEEFE', group: 'keyboard and screen-reader', pace: 1.05 },
  dev: { name: 'Dev', who: '33 · product manager in a hurry', tag: 'Knows the pattern, resents the detour.', changes: '1440×900 · ordinary desktop baseline', cfg: '1440×900', variant: 'desktop', ink: '#0369A1', soft: '#EAF6FD', group: 'experienced desktop', pace: 0.85 },
  grace: { name: 'Grace', who: '45 · lawyer, reads the fine print', tag: 'Show me what it is and what it costs before asking for my details.', changes: '1440×900 · rejects optional cookies · never shares data', cfg: '1440×900 · rejects cookies', variant: 'desktop', ink: '#4338CA', soft: '#EEF1FF', group: 'privacy-conscious', pace: 1.05 },
}

// Circle as a path, so every character is drawn from the same fixed set of <path> slots.
const C = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

export type Art = {
  bg: string; skin: string; hair: string; shirt: string; hairBack?: string; hairFront?: string
  detail?: string; detailFill?: string; detailStroke?: string; detailSw?: number
  acc1?: string; acc1Fill?: string; acc1Stroke?: string; acc1Sw?: number
  acc2?: string; acc2Fill?: string; acc2Stroke?: string; acc2Sw?: number
  acc3?: string; acc3Fill?: string; acc3Stroke?: string; acc3Sw?: number
  text?: string; tx?: number; ty?: number; tsz?: number; tfill?: string
}

export const ART: Record<AvatarId, Art> = {
  lola: { bg: '#E9D5FF', skin: '#F3CFB3', hair: '#DADCE3', shirt: '#8B5CF6',
    hairBack: C(60, 23, 9.5),
    hairFront: 'M38 54C37 36 47 28 60 28C73 28 83 36 82 54C79 44 72 38 60 38C49 38 41 44 38 54Z',
    detail: 'M51 89L60 102L69 89Z', detailFill: '#F5F3FF',
    acc1: C(52, 56, 6.8) + C(68, 56, 6.8) + 'M58.8 55.5L61.2 55.5M45.2 55L40.5 53M74.8 55L79.5 53', acc1Fill: 'rgba(255,255,255,0.2)', acc1Stroke: '#6B4E2E', acc1Sw: 1.8 },
  mika: { bg: '#FBCFE8', skin: '#F1C29C', hair: '#2A1E17', shirt: '#EC4899',
    hairBack: 'M36 58C34 37 46 26 60 26C74 26 86 37 84 58L85 76C80 78 76 76 75 71L45 71C44 76 40 78 35 76Z',
    hairFront: 'M39.5 52C40 37 50 30 61 30C72 30 80 37 80.5 50C73 47 67 43 63 37C59 44 50 49 39.5 52Z',
    detail: 'M50 89Q60 97 70 89', detailStroke: '#FFFFFF', detailSw: 2.4,
    acc1: 'M80 88h13a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3h-13a3 3 0 0 1-3-3v-21a3 3 0 0 1 3-3Z', acc1Fill: '#1F2937',
    acc2: 'M81.5 91h10v17h-10Z', acc2Fill: '#FDA4CF',
    acc3: C(86, 111, 6.5), acc3Fill: '#F1C29C' },
  // Ava now also covers keyboard-only navigation, so she carries a Tab keycap next to her screen-reader waves.
  ava: { bg: '#F5D0FE', skin: '#8D5A3C', hair: '#1C1714', shirt: '#C026D3',
    hairBack: 'M34 58C32 34 46 24 60 24C74 24 88 34 86 58L89 96C81 100 73 96 71 89L49 89C47 96 39 100 31 96Z',
    hairFront: 'M40 49C43 35 53 29 64 30C74 31 80.5 38 80.5 49C72 41 61 39 53 42.5C48 44.5 44 46.5 40 49Z',
    detail: 'M66 99h24a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4h-24a4 4 0 0 1-4-4v-11a4 4 0 0 1 4-4Z', detailFill: '#FFFFFF', detailStroke: '#A21CAF', detailSw: 1.6,
    acc1: 'M43 51.5h14a1.5 1.5 0 0 1 1.5 1.5v3.5a6.5 6.5 0 0 1-6.5 6.5h-4a6.5 6.5 0 0 1-6.5-6.5v-3.5a1.5 1.5 0 0 1 1.5-1.5ZM63 51.5h14a1.5 1.5 0 0 1 1.5 1.5v3.5a6.5 6.5 0 0 1-6.5 6.5h-4a6.5 6.5 0 0 1-6.5-6.5v-3.5a1.5 1.5 0 0 1 1.5-1.5Z', acc1Fill: '#111827',
    acc2: 'M93 47C98 52 98 62 93 67M100 41C108 50 108 64 100 73', acc2Stroke: '#A21CAF', acc2Sw: 2.6,
    acc3: 'M58.5 54L61.5 54', acc3Stroke: '#111827', acc3Sw: 2,
    text: 'Tab', tx: 78, ty: 111.5, tsz: 8.5, tfill: '#A21CAF' },
  dev: { bg: '#BAE6FD', skin: '#C68A5A', hair: '#1E1915', shirt: '#0284C7',
    hairFront: 'M39 51C37 35 48 26 61 27C70 27.5 77 31 80.5 37C83 42 82.5 47 81 51C78 45 74 42 70 41C67 45 60 46 54 44C50 48 44.5 50 39 51Z',
    detail: 'M38 93C43 85 51 83 60 87C69 83 77 85 82 93C73 91 66 93 60 97C54 93 47 91 38 93Z', detailFill: '#0369A1',
    acc1: 'M37 56C35 29 85 29 83 56', acc1Stroke: '#111827', acc1Sw: 4,
    acc2: 'M31 49h6a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-6ZM89 49h-6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h6Z', acc2Fill: '#0EA5E9', acc2Stroke: '#111827', acc2Sw: 2,
    acc3: 'M55 97v10M65 97v10', acc3Stroke: '#FFFFFF', acc3Sw: 1.8 },
  grace: { bg: '#C7D2FE', skin: '#F0C6A6', hair: '#0E0E12', shirt: '#312E81',
    hairBack: 'M35.5 56C34 36 46 26 60 26C74 26 86 36 84.5 56L86 76L73 76L73 62L47 62L47 76L34 76Z',
    hairFront: 'M39 47C40 34 50 28.5 60 28.5C70 28.5 80 34 81 47Z',
    detail: 'M48 89L60 108L72 89L66.5 88L60 99L53.5 88Z', detailFill: '#EEF2FF',
    acc1: C(40, 65, 2.4) + C(80, 65, 2.4), acc1Fill: '#FFFFFF', acc1Stroke: '#CBD5E1', acc1Sw: 0.8,
    acc2: 'M79 99h8v7h-8ZM80.5 99v-2a2.5 2.5 0 0 1 5 0v2', acc2Fill: '#FBBF24', acc2Stroke: '#B45309', acc2Sw: 1 },
}

export type Mood = 'idle' | 'think' | 'happy' | 'sad'
export const MOOD: Record<Mood, { eyes: number; arc: string; brows: string; mouth: string; mf: string; look: boolean }> = {
  idle: { eyes: 1, arc: '', brows: '', mouth: 'M55 67.5Q60 70.5 65 67.5', mf: 'none', look: false },
  think: { eyes: 1, arc: '', brows: 'M48 49.5L55 48.5M65 48L72 47', mouth: 'M58 68.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z', mf: '#24170F', look: true },
  happy: { eyes: 0, arc: 'M48.5 57Q52 52.5 55.5 57M64.5 57Q68 52.5 71.5 57', brows: '', mouth: 'M53.5 65.5Q60 74 66.5 65.5Z', mf: '#24170F', look: false },
  sad: { eyes: 1, arc: '', brows: 'M47.5 50.5L55 48M72.5 50.5L65 48', mouth: 'M55 70.5Q60 66.5 65 70.5', mf: 'none', look: false },
}
