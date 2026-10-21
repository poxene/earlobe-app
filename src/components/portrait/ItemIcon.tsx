/** Inventory glyphs pulled from Neverdawn. */

type IconDef = {
  viewBox?: string
  transform?: string
  paths: Array<{ d: string; fill?: string; opacity?: number }>
}

const ICONS: Record<string, IconDef> = {
  timber: {
    paths: [
      { d: 'M3 11 L7 3 H9 L13 11 Z', fill: '#8b5a2b' },
      { d: 'M5.2 11 L8 5.2 L10.8 11 Z', fill: '#c4894a', opacity: 0.85 },
      { d: 'M4.5 11 H11.5 V13 H4.5 Z', fill: '#5c3a1a' },
    ],
  },
  oak: {
    paths: [
      { d: 'M3 11.2 L7.2 2.8 H8.8 L13 11.2 Z', fill: '#6b4423' },
      { d: 'M5 11.2 L8 5 L11 11.2 Z', fill: '#a0672e', opacity: 0.9 },
      { d: 'M7.6 2.6 H8.4 V4.2 H7.6 Z', fill: '#3d2914' },
      { d: 'M4.2 11.2 H11.8 V13.2 H4.2 Z', fill: '#4a3018' },
    ],
  },
  hatchet: {
    paths: [
      { d: 'M7.2 3.2 L8.8 3.2 L9.2 13.4 L6.8 13.4 Z', fill: '#6b4a2a' },
      { d: 'M3.4 3.6 L8.2 2.4 L8.6 5.8 L3.2 6.4 Z', fill: '#9aa3a8' },
      { d: 'M3.6 4.2 L7.8 3.3 L8 5.2 L3.5 5.7 Z', fill: '#d7dde0', opacity: 0.7 },
    ],
  },
  wooden_hatchet: {
    paths: [
      { d: 'M7.2 3.2 L8.8 3.2 L9.2 13.4 L6.8 13.4 Z', fill: '#6b4a2a' },
      { d: 'M3.4 3.6 L8.2 2.4 L8.6 5.8 L3.2 6.4 Z', fill: '#8b5a2b' },
      { d: 'M3.6 4.2 L7.8 3.3 L8 5.2 L3.5 5.7 Z', fill: '#c4894a', opacity: 0.7 },
    ],
  },
  woodsman_axe: {
    paths: [
      { d: 'M7 2.8 L9 2.8 L9.4 13.5 L6.6 13.5 Z', fill: '#5a3a1e' },
      { d: 'M2.6 3.2 L8.4 2 L9 6.6 L2.4 7.2 Z', fill: '#8f98a0' },
      { d: 'M6.4 8.2 H9.6 V9.4 H6.4 Z', fill: '#7a5230' },
    ],
  },
  wickerby_axe: {
    paths: [
      { d: 'M7 2.8 L9 2.8 L9.4 13.5 L6.6 13.5 Z', fill: '#4a3420' },
      { d: 'M2.6 3.2 L8.4 2 L9 6.6 L2.4 7.2 Z', fill: '#8f98a0' },
      { d: 'M3 3.8 L8 2.8 L8.4 5.6 L2.8 6.4 Z', fill: '#7ec8a0', opacity: 0.55 },
      { d: 'M6.2 8 H9.8 V9.6 H6.2 Z', fill: '#5cb88a' },
      { d: 'M7.1 8.3 H8.9 V9.3 H7.1 Z', fill: '#d8ffe8', opacity: 0.8 },
    ],
  },
  felling_axe: {
    paths: [
      { d: 'M7.1 2.5 L8.9 2.5 L9.3 13.6 L6.7 13.6 Z', fill: '#4e3218' },
      { d: 'M1.8 3 L8.6 1.6 L9.2 7 L1.6 7.6 Z', fill: '#7d868e' },
      { d: 'M2 3.8 L8.2 2.6 L8.6 5.8 L2.2 6.4 Z', fill: '#c5ced4', opacity: 0.55 },
    ],
  },
  broadaxe: {
    paths: [
      { d: 'M7 2.4 L9 2.4 L9.5 13.6 L6.5 13.6 Z', fill: '#463016' },
      { d: 'M1.4 2.8 L8.8 1.2 L9.4 7.4 L1.2 8 Z', fill: '#6f7880' },
      { d: 'M6.2 9 H9.8 V10.2 H6.2 Z', fill: '#8a5a2a' },
    ],
  },
  warden_axe: {
    paths: [
      { d: 'M7 2.2 L9 2.2 L9.5 13.7 L6.5 13.7 Z', fill: '#3a2812' },
      { d: 'M1.2 2.6 L8.8 0.9 L9.5 7.6 L1 8.2 Z', fill: '#5c6a78' },
      { d: 'M7.4 4.2 L8.6 4.2 L8.8 6 L7.2 6 Z', fill: '#c9a227' },
    ],
  },
  dagger: {
    paths: [
      { d: 'M7.2 1.6 L8.8 1.6 L9.1 9.2 L6.9 9.2 Z', fill: '#b8c0c6' },
      { d: 'M7.4 1.8 L8.6 1.8 L8.8 8.8 L7.2 8.8 Z', fill: '#e8eef2', opacity: 0.65 },
      { d: 'M5.2 9 H10.8 V10.4 H5.2 Z', fill: '#6a4a28' },
      { d: 'M7.1 10.4 H8.9 V14 H7.1 Z', fill: '#4a3218' },
    ],
  },
  rusty_knife: {
    paths: [
      { d: 'M7.1 1.8 L8.9 1.8 L9.2 9 L6.8 9 Z', fill: '#8a6a4a' },
      { d: 'M5.4 9 H10.6 V10.3 H5.4 Z', fill: '#5a3a20' },
      { d: 'M7.2 10.3 H8.8 V13.8 H7.2 Z', fill: '#3a2814' },
    ],
  },
  bone_shiv: {
    paths: [
      { d: 'M7 2 L9 2 L9.2 9.2 L6.8 9.2 Z', fill: '#e6d7b8' },
      { d: 'M5.6 9 H10.4 V10.4 H5.6 Z', fill: '#c9b892' },
      { d: 'M7.2 10.4 H8.8 V13.6 H7.2 Z', fill: '#d8c9a8' },
    ],
  },
  knotted_club: {
    paths: [
      { d: 'M7 2.4 L9 2.4 L9.6 13.4 L6.4 13.4 Z', fill: '#6b4423' },
      { d: 'M5.2 2 H10.8 V5.2 H5.2 Z', fill: '#8a5732' },
      { d: 'M6 3.2 H7.2 V4.2 H6 Z', fill: '#5a3a1e', opacity: 0.6 },
    ],
  },
  scrap_cleaver: {
    paths: [
      { d: 'M4 3.2 L11.5 2.2 L12 6.4 L3.6 6.8 Z', fill: '#8f98a0' },
      { d: 'M7.2 6.6 L8.8 6.6 L9.2 13.4 L6.8 13.4 Z', fill: '#5a3a1e' },
    ],
  },
  short_sword: {
    paths: [
      { d: 'M7.2 1.4 L8.8 1.4 L9.1 9.6 L6.9 9.6 Z', fill: '#b8c0c6' },
      { d: 'M5.2 9.4 H10.8 V10.8 H5.2 Z', fill: '#6a4a28' },
      { d: 'M7.1 10.8 H8.9 V14.2 H7.1 Z', fill: '#4a3218' },
    ],
  },
  long_sword: {
    paths: [
      { d: 'M7.1 0.8 L8.9 0.8 L9.2 10.2 L6.8 10.2 Z', fill: '#c5ced4' },
      { d: 'M7.3 1 L8.7 1 L8.9 9.8 L7.1 9.8 Z', fill: '#e8eef2', opacity: 0.5 },
      { d: 'M4.6 10 H11.4 V11.4 H4.6 Z', fill: '#6a4a28' },
      { d: 'M7 11.4 H9 V14.4 H7 Z', fill: '#4a3218' },
    ],
  },
  morning_star: {
    paths: [
      { d: 'M7.1 6.8 L8.9 6.8 L9.2 14 L6.8 14 Z', fill: '#5a3a1e' },
      { d: 'M8 2.2 A3.2 3.2 0 1 1 8 8.6 A3.2 3.2 0 1 1 8 2.2', fill: '#8f98a0' },
      { d: 'M7.6 1.2 H8.4 V3 H7.6 Z', fill: '#c5ced4' },
      { d: 'M10.4 4.4 H12.2 V5.2 H10.4 Z', fill: '#c5ced4' },
      { d: 'M3.8 4.4 H5.6 V5.2 H3.8 Z', fill: '#c5ced4' },
    ],
  },
  cleaver: {
    paths: [
      { d: 'M3.6 2.4 L12.4 1.8 L12.8 7.2 L3.2 7.6 Z', fill: '#b8c0c6' },
      { d: 'M4 3 L12 2.4 L12.2 6.4 L3.6 6.8 Z', fill: '#e8eef2', opacity: 0.45 },
      { d: 'M7 7.4 L8.8 7.4 L9.2 14 L6.8 14 Z', fill: '#5a3a1e' },
    ],
  },
  mace: {
    paths: [
      { d: 'M7.2 6.4 L8.8 6.4 L9.1 14 L6.9 14 Z', fill: '#5a3a1e' },
      { d: 'M5.2 2.2 H10.8 V6.6 H5.2 Z', fill: '#8f98a0' },
      { d: 'M6 2.8 H10 V6 H6 Z', fill: '#c5ced4', opacity: 0.55 },
    ],
  },
  great_axe: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7 1.2 L9 1.2 L9.6 25.4 L6.4 25.4 Z', fill: '#4e3218' },
      { d: 'M1.6 1.8 L8.8 1 L9.4 7.2 L1.4 7.8 Z', fill: '#8f98a0' },
      { d: 'M2 2.6 L8.4 2 L8.8 5.8 L2.2 6.4 Z', fill: '#c5ced4', opacity: 0.45 },
    ],
  },
  claymore: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7 0.6 L9 0.6 L9.3 10.6 L6.7 10.6 Z', fill: '#c5ced4' },
      { d: 'M7.2 0.8 L8.8 0.8 L9 10.2 L7 10.2 Z', fill: '#e8eef2', opacity: 0.5 },
      { d: 'M3.8 10.2 H12.2 V11.8 H3.8 Z', fill: '#6a4a28' },
      { d: 'M6.8 11.8 H9.2 V24.6 H6.8 Z', fill: '#4a3218' },
      { d: 'M6.2 24.4 H9.8 V25.6 H6.2 Z', fill: '#3a2814' },
    ],
  },
  evening_star: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7 6.6 L9 6.6 L9.5 25.4 L6.5 25.4 Z', fill: '#4e3218' },
      { d: 'M8 1.6 A3.6 3.6 0 1 1 8 8.8 A3.6 3.6 0 1 1 8 1.6', fill: '#8f98a0' },
      { d: 'M7.5 0.6 H8.5 V2.4 H7.5 Z', fill: '#c5ced4' },
      { d: 'M11.4 4.4 H13.2 V5.4 H11.4 Z', fill: '#c5ced4' },
      { d: 'M2.8 4.4 H4.6 V5.4 H2.8 Z', fill: '#c5ced4' },
      { d: 'M7.5 8.2 H8.5 V10 H7.5 Z', fill: '#c5ced4' },
    ],
  },
  frayed_cap: {
    paths: [
      { d: 'M3.6 8.2 Q8 3.2 12.4 8.2 L11.6 10 H4.4 Z', fill: '#6a5848' },
      { d: 'M4.2 8.6 H11.8 V10.2 H4.2 Z', fill: '#8a7460' },
    ],
  },
  hide_vest: {
    paths: [
      { d: 'M4.2 3.6 L8 2.4 L11.8 3.6 L12.2 13.2 H3.8 Z', fill: '#7a5230' },
      { d: 'M5.4 5 H10.6 V11.8 H5.4 Z', fill: '#9a6a40', opacity: 0.7 },
    ],
  },
  scrap_wraps: {
    paths: [
      { d: 'M3.2 5.2 H6.8 V11 H3.2 Z', fill: '#8a6a4a' },
      { d: 'M9.2 5.2 H12.8 V11 H9.2 Z', fill: '#8a6a4a' },
      { d: 'M3.8 6.2 H6.2 V7.2 H3.8 Z', fill: '#6a4a30' },
    ],
  },
  patchwork_greaves: {
    paths: [
      { d: 'M4 3.4 H7.2 V13 H4 Z', fill: '#5c4634' },
      { d: 'M8.8 3.4 H12 V13 H8.8 Z', fill: '#5c4634' },
      { d: 'M4.6 6 H6.6 V7.2 H4.6 Z', fill: '#8a6a4a' },
    ],
  },
  mud_boots: {
    paths: [
      { d: 'M3.4 6.2 H7 V12.4 H2.8 Z', fill: '#4a3424' },
      { d: 'M9 6.2 H12.6 V12.4 H8.4 Z', fill: '#4a3424' },
      { d: 'M2.6 11.4 H7.2 V13.2 H2.6 Z', fill: '#6a4a30' },
      { d: 'M8.2 11.4 H12.8 V13.2 H8.2 Z', fill: '#6a4a30' },
    ],
  },
  wolf_fang: {
    paths: [
      { d: 'M6.2 13 L7.4 2.8 H8.8 L11.2 13 Z', fill: '#efe6d0' },
      { d: 'M7.2 11 L8.2 4.4 L9.8 11 Z', fill: '#f7f0e0', opacity: 0.7 },
    ],
  },
  moth_wing: {
    paths: [
      { d: 'M8 8.2 L3.2 4.2 Q2.4 8 4.8 11.2 Z', fill: '#c4b8a0', opacity: 0.85 },
      { d: 'M8 8.2 L12.8 4.2 Q13.6 8 11.2 11.2 Z', fill: '#d9cbb0', opacity: 0.85 },
      { d: 'M7.6 7.6 H8.4 V13 H7.6 Z', fill: '#8a7a60' },
    ],
  },
  lurker_eye: {
    paths: [
      { d: 'M8 3.2 A5 5 0 1 1 8 13.2 A5 5 0 1 1 8 3.2', fill: '#3a6a4a' },
      { d: 'M8 5.2 A3 3 0 1 1 8 11.2 A3 3 0 1 1 8 5.2', fill: '#8fe0b0', opacity: 0.55 },
      { d: 'M8 6.6 A1.6 1.6 0 1 1 8 9.8 A1.6 1.6 0 1 1 8 6.6', fill: '#1a140f' },
    ],
  },
  leather_belt: {
    paths: [
      { d: 'M2 6.4 H14 V9.6 H2 Z', fill: '#6b4226' },
      { d: 'M2.4 7 H13.6 V9 H2.4 Z', fill: '#8a5732', opacity: 0.8 },
      { d: 'M6.6 5.6 H9.4 V10.4 H6.6 Z', fill: '#c9a227' },
      { d: 'M7.2 6.4 H8.8 V9.6 H7.2 Z', fill: '#8a7018' },
    ],
  },
  rat_king_wraps: {
    paths: [
      { d: 'M3.2 5.2 H6.8 V11 H3.2 Z', fill: '#6e5a4a' },
      { d: 'M9.2 5.2 H12.8 V11 H9.2 Z', fill: '#6e5a4a' },
      { d: 'M3.8 6.2 H6.2 V7.2 H3.8 Z', fill: '#4a3a30' },
      { d: 'M9.8 8 H12.2 V9 H9.8 Z', fill: '#9a7a68' },
    ],
  },
  rat_king_treads: {
    paths: [
      { d: 'M3.4 6.2 H7 V12.4 H2.8 Z', fill: '#5a4638' },
      { d: 'M9 6.2 H12.6 V12.4 H8.4 Z', fill: '#5a4638' },
      { d: 'M2.6 11.4 H7.2 V13.2 H2.6 Z', fill: '#8a7360' },
      { d: 'M8.2 11.4 H12.8 V13.2 H8.2 Z', fill: '#8a7360' },
      { d: 'M4 8.2 H6.2 V9 H4 Z', fill: '#9a7a68' },
    ],
  },
  rat_king_hood: {
    paths: [
      { d: 'M3.6 8.2 Q8 3.2 12.4 8.2 L11.6 10 H4.4 Z', fill: '#6e5a4a' },
      { d: 'M4.2 8.6 H11.8 V10.2 H4.2 Z', fill: '#8a7360' },
      { d: 'M6.4 4.2 H9.6 V6.4 H6.4 Z', fill: '#ebe0c4' },
      { d: 'M7.2 3.2 H8.8 V4.6 H7.2 Z', fill: '#f4ecda' },
    ],
  },
  rat_king_greaves: {
    paths: [
      { d: 'M4 3.4 H7.2 V13 H4 Z', fill: '#5c4634' },
      { d: 'M8.8 3.4 H12 V13 H8.8 Z', fill: '#5c4634' },
      { d: 'M4.4 5.6 H6.8 V7 H4.4 Z', fill: '#ebe0c4' },
      { d: 'M9.2 8.4 H11.6 V9.8 H9.2 Z', fill: '#9a7a68' },
    ],
  },
  rat_king_hide: {
    paths: [
      { d: 'M4.2 3.6 L8 2.4 L11.8 3.6 L12.2 13.2 H3.8 Z', fill: '#6e5a4a' },
      { d: 'M5.4 5 H10.6 V11.8 H5.4 Z', fill: '#8a7360', opacity: 0.75 },
      { d: 'M6.2 7.2 H9.8 V8.4 H6.2 Z', fill: '#4a7a3a', opacity: 0.7 },
    ],
  },
  rat_king_cinch: {
    paths: [
      { d: 'M2 6.4 H14 V9.6 H2 Z', fill: '#5a4638' },
      { d: 'M2.4 7 H13.6 V9 H2.4 Z', fill: '#8a7360', opacity: 0.8 },
      { d: 'M6.4 5.4 H9.6 V10.6 H6.4 Z', fill: '#3a9a6a' },
      { d: 'M7.2 6.2 H8.8 V9.8 H7.2 Z', fill: '#6fd4a0', opacity: 0.85 },
    ],
  },
  canal_wraps: {
    paths: [
      { d: 'M3.2 5.2 H6.8 V11 H3.2 Z', fill: '#3a9a6a' },
      { d: 'M9.2 5.2 H12.8 V11 H9.2 Z', fill: '#3a9a6a' },
      { d: 'M3.8 6.4 H6.2 V7.6 H3.8 Z', fill: '#8fe0b0', opacity: 0.7 },
      { d: 'M9.8 8 H12.2 V9.2 H9.8 Z', fill: '#4a7a3a' },
    ],
  },
  canal_treads: {
    paths: [
      { d: 'M3.4 6.2 H7 V12.4 H2.8 Z', fill: '#2e6a4a' },
      { d: 'M9 6.2 H12.6 V12.4 H8.4 Z', fill: '#2e6a4a' },
      { d: 'M2.6 11.4 H7.2 V13.2 H2.6 Z', fill: '#4a7a3a' },
      { d: 'M8.2 11.4 H12.8 V13.2 H8.2 Z', fill: '#4a7a3a' },
      { d: 'M4.2 8 H6 V9 H4.2 Z', fill: '#8fe0b0', opacity: 0.7 },
    ],
  },
  canal_hood: {
    paths: [
      { d: 'M3.6 8.2 Q8 3.2 12.4 8.2 L11.6 10 H4.4 Z', fill: '#3a9a6a' },
      { d: 'M4.2 8.6 H11.8 V10.2 H4.2 Z', fill: '#4a7a3a' },
      { d: 'M6.8 5.2 H9.2 V7.4 H6.8 Z', fill: '#6fd4a0' },
    ],
  },
  brass_ring: {
    paths: [
      { d: 'M4.2 4.2 H11.8 V11.8 H4.2 Z', fill: '#b08a3a' },
      { d: 'M5.4 5.4 H10.6 V10.6 H5.4 Z', fill: '#0b1410' },
      { d: 'M4.8 4.8 H11.2 V5.8 H4.8 Z', fill: '#d4b05a', opacity: 0.7 },
    ],
  },
  rose_stew: {
    paths: [
      { d: 'M4.2 5.2 H11.8 V12.6 H4.2 Z', fill: '#5a4030' },
      { d: 'M4.8 5.8 H11.2 V11.8 H4.8 Z', fill: '#8b4518' },
      { d: 'M3.6 4.4 H12.4 V6 H3.6 Z', fill: '#7a5a3a' },
      { d: 'M6.2 3.2 H9.8 V4.6 H6.2 Z', fill: '#9a7348' },
      { d: 'M5.4 7.2 H6.8 V8.4 H5.4 Z', fill: '#d4a574', opacity: 0.7 },
    ],
  },
  scrap_hide: {
    paths: [
      { d: 'M3.2 4.2 L8 2.8 L12.8 4.6 L13 11.2 L8.2 13.2 L3 11 Z', fill: '#8a5a3a' },
      { d: 'M4.2 5.2 L8 4 L12 5.4 L12.1 10.4 L8.1 11.8 L4.1 10.2 Z', fill: '#b07a52', opacity: 0.75 },
    ],
  },
  rat_skin: {
    paths: [
      { d: 'M3.4 4.8 L8.2 3.2 L12.6 5 L12.4 11.4 L7.8 13 L3.2 11 Z', fill: '#6e5a4a' },
      { d: 'M4.4 5.8 L8.1 4.4 L11.6 5.8 L11.4 10.6 L7.9 11.8 L4.4 10.4 Z', fill: '#8a7360', opacity: 0.8 },
    ],
  },
  rat_tail: {
    paths: [
      { d: 'M3 7.4 C5.8 3.2 9.4 6.2 11.8 8.2 C12.8 9 13.4 7.2 12.6 6.4 C10.8 8.6 7.8 5.2 4.2 8.6 Z', fill: '#9a7a68' },
      { d: 'M2.4 7.2 H4.2 V9 H2.4 Z', fill: '#6a5040' },
    ],
  },
  gnawed_bone: {
    transform: 'rotate(-28 8 8)',
    paths: [
      { d: 'M5.2 5 H10.8 V7.2 H5.2 Z', fill: '#ebe0c4' },
      // Left knobs
      { d: 'M3.6 3.6 A1.7 1.7 0 1 1 3.6 7 A1.7 1.7 0 1 1 3.6 3.6 Z', fill: '#ebe0c4' },
      { d: 'M3.6 5.2 A1.7 1.7 0 1 1 3.6 8.6 A1.7 1.7 0 1 1 3.6 5.2 Z', fill: '#ebe0c4' },
      // Right knobs
      { d: 'M12.4 3.6 A1.7 1.7 0 1 1 12.4 7 A1.7 1.7 0 1 1 12.4 3.6 Z', fill: '#ebe0c4' },
      { d: 'M12.4 5.2 A1.7 1.7 0 1 1 12.4 8.6 A1.7 1.7 0 1 1 12.4 5.2 Z', fill: '#ebe0c4' },
      // Shaft sheen
      { d: 'M5.6 5.35 H10.4 V6.55 H5.6 Z', fill: '#faf4e6', opacity: 0.8 },
      // Knuckle shade
      { d: 'M3.6 4.1 A1 1 0 1 1 3.6 6.1 A1 1 0 0 1 3.6 4.1 Z', fill: '#c9b892', opacity: 0.4 },
      { d: 'M12.4 4.1 A1 1 0 1 1 12.4 6.1 A1 1 0 0 1 12.4 4.1 Z', fill: '#c9b892', opacity: 0.4 },
      // Gnaw nick
      { d: 'M7.5 4.95 C8.15 4.45 8.85 5.25 8.45 5.85 L7.55 5.9 Z', fill: '#8f7d5c', opacity: 0.55 },
    ],
  },
  cracked_tusk: {
    paths: [
      { d: 'M4.2 12.8 L6.2 2.8 H8.4 L11.6 12.8 Z', fill: '#e8dcc0' },
      { d: 'M5.4 11.6 L7 4.2 L9.8 11.6 Z', fill: '#f4ecda', opacity: 0.65 },
      { d: 'M6.6 6.4 L8.2 8.8 L7.4 9.2 L5.8 6.8 Z', fill: '#8a7a60', opacity: 0.55 },
    ],
  },
  moth_dust: {
    paths: [
      { d: 'M8 7.2 A2.4 3.2 0 1 0 8 13.6 A2.4 3.2 0 1 0 8 7.2', fill: '#c4b8a0', opacity: 0.55 },
      { d: 'M4.2 3.4 A1.4 1.4 0 1 0 4.2 6.2 A1.4 1.4 0 1 0 4.2 3.4', fill: '#d9cbb0', opacity: 0.7 },
      { d: 'M11.6 4 A1.1 1.1 0 1 0 11.6 6.2 A1.1 1.1 0 1 0 11.6 4', fill: '#cfc0a4', opacity: 0.65 },
      { d: 'M9.4 2.4 A0.9 0.9 0 1 0 9.4 4.2 A0.9 0.9 0 1 0 9.4 2.4', fill: '#e2d6bc', opacity: 0.8 },
    ],
  },
  rime_dust: {
    paths: [
      { d: 'M8 3.2 L9.2 6.6 L12.8 6.8 L10 9.2 L10.8 12.8 L8 10.8 L5.2 12.8 L6 9.2 L3.2 6.8 L6.8 6.6 Z', fill: '#c5e4f4' },
      { d: 'M8 5 L8.7 7.2 L11 7.3 L9.2 8.9 L9.7 11.2 L8 9.9 L6.3 11.2 L6.8 8.9 L5 7.3 L7.3 7.2 Z', fill: '#eef8ff', opacity: 0.8 },
    ],
  },
  moon_salt: {
    paths: [
      { d: 'M5.2 10.8 L8 3.4 L10.8 10.8 Z', fill: '#7ea0d4' },
      { d: 'M6.2 10 L8 5.4 L9.8 10 Z', fill: '#d4dcec', opacity: 0.75 },
      { d: 'M10.4 3.6 A2.4 2.4 0 1 0 10.4 8.4 A1.8 1.8 0 1 1 10.4 3.6 Z', fill: '#c9d6f0', opacity: 0.85 },
    ],
  },
  rose_petal: {
    paths: [
      { d: 'M8 3.2 Q11.6 5.2 11.2 9.2 Q8 13.4 4.8 9.2 Q4.4 5.2 8 3.2 Z', fill: '#8b3a3a' },
      { d: 'M8 4.6 Q10.4 6.2 10.2 8.8 Q8 11.8 5.8 8.8 Q5.6 6.2 8 4.6 Z', fill: '#a84a48', opacity: 0.75 },
      { d: 'M7.6 6.2 L8.4 6.2 L8.2 10.4 L7.8 10.4 Z', fill: '#5c3a24', opacity: 0.55 },
    ],
  },
  rose_oil: {
    paths: [
      { d: 'M6.6 2.4 H9.4 V4.2 H6.6 Z', fill: '#6b4423' },
      { d: 'M5.6 4.2 H10.4 L11 13.6 H5 Z', fill: '#8a5732' },
      { d: 'M6.2 5.2 H9.8 L10.2 12.6 H5.8 Z', fill: '#8b3a3a' },
      { d: 'M6.8 6 H8.2 V9.4 H6.8 Z', fill: '#c97878', opacity: 0.65 },
    ],
  },
  wraith_mote: {
    paths: [
      { d: 'M8 2.2 L9.2 6.4 L13.6 6.6 L10.2 9.4 L11.2 13.6 L8 11.2 L4.8 13.6 L5.8 9.4 L2.4 6.6 L6.8 6.4 Z', fill: '#7ec8e8' },
      { d: 'M8 4.2 L8.7 6.8 L11.4 7 L9.3 8.7 L9.9 11.4 L8 10 L6.1 11.4 L6.7 8.7 L4.6 7 L7.3 6.8 Z', fill: '#dff4ff', opacity: 0.75 },
    ],
  },
  wisp_mote: {
    paths: [
      { d: 'M8 2.4 A5.6 5.6 0 1 1 8 13.6 A5.6 5.6 0 1 1 8 2.4', fill: '#7eb8e8', opacity: 0.55 },
      { d: 'M8 4.6 A3.4 3.4 0 1 1 8 11.4 A3.4 3.4 0 1 1 8 4.6', fill: '#d8ecff', opacity: 0.9 },
      { d: 'M8 6.2 A1.8 1.8 0 1 1 8 9.8 A1.8 1.8 0 1 1 8 6.2', fill: '#f7fbff' },
    ],
  },
  pale_dew: {
    paths: [
      { d: 'M8 2.6 Q12.4 7.2 8 13.4 Q3.6 7.2 8 2.6 Z', fill: '#9bb8d8' },
      { d: 'M8 4.4 Q10.8 7.4 8 11.4 Q5.2 7.4 8 4.4 Z', fill: '#e4eef8', opacity: 0.7 },
    ],
  },
  moonwort: {
    paths: [
      { d: 'M7.5 13.2 H8.5 V6.2 H7.5 Z', fill: '#4a6a38' },
      { d: 'M8 6.4 Q3.8 4.8 4.8 8.4 Q6.8 8.2 8 6.4 Z', fill: '#7a9a62' },
      { d: 'M8 6.8 Q12.2 5.2 11.2 8.8 Q9.2 8.4 8 6.8 Z', fill: '#8aab78' },
      { d: 'M8 3.2 A2.4 2.4 0 1 1 8 8 A2.4 2.4 0 1 1 8 3.2', fill: '#eef4dc' },
      { d: 'M8 4.4 A1.1 1.1 0 1 1 8 6.6 A1.1 1.1 0 1 1 8 4.4', fill: '#c9d48a' },
    ],
  },
  duskleaf: {
    paths: [
      { d: 'M7.5 13.2 H8.5 V6.4 H7.5 Z', fill: '#24382c' },
      { d: 'M8 6.6 Q3.6 5 4.8 8.8 Q7 8.4 8 6.6 Z', fill: '#3a4a38' },
      { d: 'M8 7 Q12.4 5.4 11.2 9 Q9 8.6 8 7 Z', fill: '#4a3a58' },
      { d: 'M8 3.4 A2.3 2.3 0 1 1 8 8 A2.3 2.3 0 1 1 8 3.4', fill: '#8a6aaa' },
      { d: 'M8 4.6 A1 1 0 1 1 8 6.6 A1 1 0 1 1 8 4.6', fill: '#d8c8e8' },
    ],
  },
  wisp_thread: {
    paths: [
      { d: 'M2.8 12.6 C5.2 6 9.2 5 13.6 3.6 L13 5.2 C9 6.4 5.6 7.4 3.6 12.4 Z', fill: '#b8d8f0' },
      { d: 'M3.4 11.8 C5.6 6.6 9.4 6 12.8 4.8 L12.4 6 C9.2 7 6 7.6 4.2 11.8 Z', fill: '#e8f4ff', opacity: 0.8 },
    ],
  },
  hare_whisker: {
    paths: [
      { d: 'M2.4 7.6 L13.6 4.6 L13.8 5.5 L2.6 8.5 Z', fill: '#e8dcc8' },
      { d: 'M2.5 9.2 L13.4 8.8 L13.5 9.6 L2.6 10 Z', fill: '#d4c4b0' },
      { d: 'M2.6 10.8 L13.2 12.2 L13 13 L2.4 11.6 Z', fill: '#e8dcc8' },
    ],
  },
  dusk_pelt: {
    paths: [
      { d: 'M3.2 5.2 L8 2.8 L12.8 5 L13 11.4 L8.2 13.4 L3 11.2 Z', fill: '#3a2a28' },
      { d: 'M4.4 6 L8 4.2 L11.6 6 L11.8 10.8 L8.1 12.2 L4.4 10.6 Z', fill: '#6a4a40', opacity: 0.8 },
    ],
  },
  lucky_foot: {
    paths: [
      { d: 'M6.2 3.2 H9.6 L10.4 9.2 H5.6 Z', fill: '#7a5a40' },
      { d: 'M4.4 9 H11.6 Q12.6 13.2 8 13.4 Q3.4 13.2 4.4 9 Z', fill: '#c4a078' },
      { d: 'M5.2 11.2 H6.6 V13 H5.2 Z', fill: '#e8d2a8' },
      { d: 'M7.2 11.4 H8.6 V13.2 H7.2 Z', fill: '#e8d2a8' },
      { d: 'M9.2 11.2 H10.6 V13 H9.2 Z', fill: '#e8d2a8' },
    ],
  },
  slime_gel: {
    paths: [
      { d: 'M4.2 6.2 Q8 2.4 11.8 6.2 Q13.2 9.8 11.4 12.6 Q8 14.2 4.6 12.6 Q2.8 9.8 4.2 6.2 Z', fill: '#5cb88a' },
      { d: 'M5.4 7 Q8 4.4 10.6 7 Q11.6 9.4 10.2 11.4 Q8 12.6 5.8 11.4 Q4.4 9.4 5.4 7 Z', fill: '#8fe0b0', opacity: 0.55 },
      { d: 'M6.4 7.4 H7.6 V8.6 H6.4 Z', fill: '#e8fff0', opacity: 0.7 },
    ],
  },
  slime_core: {
    paths: [
      { d: 'M8 2.6 A5.4 5.4 0 1 1 8 13.4 A5.4 5.4 0 1 1 8 2.6', fill: '#3a9a6a' },
      { d: 'M8 4.4 A3.6 3.6 0 1 1 8 11.6 A3.6 3.6 0 1 1 8 4.4', fill: '#6fd4a0', opacity: 0.7 },
      { d: 'M8 6 A2 2 0 1 1 8 10 A2 2 0 1 1 8 6', fill: '#d8ffe8', opacity: 0.85 },
    ],
  },
  canal_moss: {
    paths: [
      { d: 'M3.6 12.2 C4.6 6 5.8 8.4 6.6 12.2 C7.2 7.6 8 9.2 8.6 12.4 C9.4 7.2 10.4 9 11.2 12.2 C12 8 13 10.2 13.4 12.4 L12.2 13 H4.2 Z', fill: '#4a7a3a' },
      { d: 'M5 10.4 C5.6 7.8 6.4 8.8 6.8 11 C7.4 8.2 8.2 9 8.8 11.2 C9.4 8.4 10.2 9.2 10.8 11.2 L10 12 H5.4 Z', fill: '#6a9a4a', opacity: 0.7 },
    ],
  },
  lute: {
    paths: [
      { d: 'M6.2 1.8 L9.8 1.8 L10.4 6.2 L5.6 6.2 Z', fill: '#8a5a2a' },
      { d: 'M5.2 6 L10.8 6 L11.4 13.2 L4.6 13.2 Z', fill: '#a87238' },
      { d: 'M7.2 2.4 H8.8 V12.4 H7.2 Z', fill: '#d8c4a0', opacity: 0.55 },
      { d: 'M6.8 8.2 H9.2 V8.8 H6.8 Z', fill: '#3d2c1c' },
    ],
  },
  chest_key: {
    paths: [
      { d: 'M3 5.6 H8.2 V6.8 H13.4 V8.2 H11.8 V9.8 H10.2 V8.2 H8.2 V10.4 H3 V5.6 Z', fill: '#c9a15b' },
      { d: 'M4.4 7.2 H6.6 V8.8 H4.4 Z', fill: '#2a1e14' },
    ],
  },
  chest_expand_1: {
    paths: [
      { d: 'M2.6 4.2 H13.4 V12.8 H2.6 Z', fill: '#6b4423' },
      { d: 'M3.2 4.8 H12.8 V7.2 H3.2 Z', fill: '#8a5a2a' },
      { d: 'M3.2 7.8 H12.8 V12.2 H3.2 Z', fill: '#a87238' },
      { d: 'M7.2 8.6 H8.8 V10.4 H7.2 Z', fill: '#c9a15b' },
    ],
  },
  chest_expand_2: {
    paths: [
      { d: 'M2.6 3.4 H13.4 V13.2 H2.6 Z', fill: '#5a381c' },
      { d: 'M3.2 4 H12.8 V6.4 H3.2 Z', fill: '#8a5a2a' },
      { d: 'M3.2 7 H12.8 V9.4 H3.2 Z', fill: '#a87238' },
      { d: 'M3.2 10 H12.8 V12.6 H3.2 Z', fill: '#c48a48' },
      { d: 'M7.2 10.6 H8.8 V12 H7.2 Z', fill: '#c9a15b' },
    ],
  },
  flute: {
    paths: [
      { d: 'M2.4 7.2 H13.6 V8.8 H2.4 Z', fill: '#d8c9a8' },
      { d: 'M3.2 7.4 H4 V8.6 H3.2 Z', fill: '#3a2814' },
      { d: 'M5.4 7.4 H6 V8.6 H5.4 Z', fill: '#3a2814' },
      { d: 'M7.6 7.4 H8.2 V8.6 H7.6 Z', fill: '#3a2814' },
      { d: 'M9.8 7.4 H10.4 V8.6 H9.8 Z', fill: '#3a2814' },
      { d: 'M12 7.2 H13.4 V8.8 H12 Z', fill: '#c9a15b' },
    ],
  },
  hand_drum: {
    paths: [
      { d: 'M3.2 5.2 H12.8 V11.6 H3.2 Z', fill: '#6b4423' },
      { d: 'M3.6 5.6 H12.4 V7.2 H3.6 Z', fill: '#c9a15b' },
      { d: 'M4.2 8 H5.4 V10.8 H4.2 Z', fill: '#3d2c1c' },
      { d: 'M10.6 8 H11.8 V10.8 H10.6 Z', fill: '#3d2c1c' },
    ],
  },
  ash_wand: {
    paths: [
      { d: 'M7.75 3.1 L8.25 3.1 L8.85 14.6 L7.15 14.6 Z', fill: '#6b4423' },
      { d: 'M7.85 3.2 L8.15 3.2 L8.55 14.2 L7.45 14.2 Z', fill: '#c4894a', opacity: 0.55 },
      { d: 'M7.05 10.6 H8.95 V12.5 H7.05 Z', fill: '#4a3218' },
      { d: 'M7.25 10.85 H8.75 V12.2 H7.25 Z', fill: '#8a5a2a', opacity: 0.7 },
      { d: 'M8 0.45 L9.35 2.15 L8 3.55 L6.65 2.15 Z', fill: '#7ec8e8' },
      { d: 'M8 1.05 L8.85 2.15 L8 3.05 L7.15 2.15 Z', fill: '#f4fcff', opacity: 0.8 },
      { d: 'M8 1.7 A0.45 0.45 0 1 1 8 2.6 A0.45 0.45 0 1 1 8 1.7', fill: '#dff4ff' },
    ],
  },
  knotted_staff: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7.15 4.8 L8.85 4.8 L9.4 25.4 L6.6 25.4 Z', fill: '#5a3a1e' },
      { d: 'M7.35 5 L8.65 5 L9.05 24.6 L6.95 24.6 Z', fill: '#8a5732', opacity: 0.55 },
      { d: 'M5.6 2.2 H10.4 V6.2 H5.6 Z', fill: '#6b4423' },
      { d: 'M6.2 2.8 H9.8 V5.6 H6.2 Z', fill: '#8a5a2a' },
      { d: 'M8 1.4 A1.8 1.8 0 1 1 8 5 A1.8 1.8 0 1 1 8 1.4', fill: '#7ec8e8' },
      { d: 'M8 2.1 A1 1 0 1 1 8 4.1 A1 1 0 1 1 8 2.1', fill: '#dff4ff', opacity: 0.7 },
    ],
  },
  pitch_wand: {
    paths: [
      { d: 'M7.7 3.2 L8.3 3.2 L8.9 14.6 L7.1 14.6 Z', fill: '#141210' },
      { d: 'M7.85 3.3 L8.15 3.3 L8.55 14.2 L7.45 14.2 Z', fill: '#3a3432', opacity: 0.7 },
      { d: 'M7 10.5 H9 V12.6 H7 Z', fill: '#2a2a30' },
      { d: 'M7.2 10.7 H8.8 V12.35 H7.2 Z', fill: '#5a5a66', opacity: 0.65 },
      { d: 'M8 0.15 L9.7 2.2 A1.55 1.55 0 1 1 6.3 2.2 Z', fill: '#c41c18', opacity: 0.35 },
      { d: 'M8 0.35 L9.4 2.25 A1.4 1.4 0 1 1 6.6 2.25 Z', fill: '#d4221c' },
      { d: 'M8 0.95 L8.85 2.2 A0.85 0.85 0 1 1 7.15 2.2 Z', fill: '#ff7a4a', opacity: 0.9 },
      { d: 'M8 1.7 A0.4 0.4 0 1 1 8 2.5 A0.4 0.4 0 1 1 8 1.7', fill: '#ffe8c8' },
    ],
  },
  pitch_staff: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7.2 5.2 L8.8 5.2 L9.35 25.4 L6.65 25.4 Z', fill: '#141210' },
      { d: 'M7.4 5.4 L8.6 5.4 L9 24.7 L7 24.7 Z', fill: '#3a3432', opacity: 0.65 },
      { d: 'M5.7 3.4 H10.3 V6.6 H5.7 Z', fill: '#2a2a30' },
      { d: 'M6.3 3.95 H9.7 V6.05 H6.3 Z', fill: '#5a5a66' },
      { d: 'M8 0.2 L11.1 3.35 A3.1 3.1 0 1 1 4.9 3.35 Z', fill: '#c41c18', opacity: 0.3 },
      { d: 'M8 0.55 L10.45 3.25 A2.45 2.45 0 1 1 5.55 3.25 Z', fill: '#d4221c' },
      { d: 'M8 1.35 L9.35 3.2 A1.35 1.35 0 1 1 6.65 3.2 Z', fill: '#ff7a4a', opacity: 0.88 },
      { d: 'M8 2.35 A0.7 0.7 0 1 1 8 3.75 A0.7 0.7 0 1 1 8 2.35', fill: '#ffe8c8' },
    ],
  },
  moon_wand: {
    paths: [
      { d: 'M7.7 3.6 L8.3 3.6 L8.85 14.55 L7.15 14.55 Z', fill: '#d8cbb0' },
      { d: 'M7.85 3.7 L8.15 3.7 L8.5 14.15 L7.5 14.15 Z', fill: '#f4ead4', opacity: 0.7 },
      { d: 'M7.1 10.45 H8.9 V12.25 H7.1 Z', fill: '#8a78b8' },
      { d: 'M7.25 10.6 H8.75 V12.05 H7.25 Z', fill: '#e8deff', opacity: 0.7 },
      { d: 'M11.05 0.2 L8.85 0.55 L7.35 1.4 L6.95 2.25 L7.35 3.1 L8.85 3.95 L11.05 4.3 L9.15 3.2 L8.45 2.25 L9.15 1.3 Z', fill: '#c4b0f4', opacity: 0.4 },
      { d: 'M10.7 0.4 L8.8 0.7 L7.5 1.45 L7.2 2.25 L7.5 3.05 L8.8 3.8 L10.7 4.1 L9.05 3.15 L8.45 2.25 L9.05 1.35 Z', fill: '#d8c8ff' },
      { d: 'M10.15 0.85 L8.95 1.1 L8.15 1.65 L7.95 2.25 L8.15 2.85 L8.95 3.4 L10.15 3.65 L9.05 2.85 L8.75 2.25 L9.05 1.65 Z', fill: '#f6f0ff', opacity: 0.85 },
    ],
  },
  moon_staff: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7.2 6.4 L8.8 6.4 L9.3 25.4 L6.7 25.4 Z', fill: '#d0c3a6' },
      { d: 'M7.4 6.55 L8.6 6.55 L8.95 24.8 L7.05 24.8 Z', fill: '#f4ead4', opacity: 0.65 },
      { d: 'M5.7 4.55 H10.3 V7.45 H5.7 Z', fill: '#8a78b8' },
      { d: 'M6.3 5.05 H9.7 V6.95 H6.3 Z', fill: '#e4d8ff' },
      { d: 'M12.35 0.15 L9.2 0.7 L6.95 2.0 L6.4 3.25 L6.95 4.5 L9.2 5.8 L12.35 6.35 L9.45 4.7 L8.4 3.25 L9.45 1.8 Z', fill: '#c4b0f4', opacity: 0.38 },
      { d: 'M11.85 0.4 L9.15 0.9 L7.2 2.1 L6.75 3.25 L7.2 4.4 L9.15 5.6 L11.85 6.1 L9.35 4.55 L8.45 3.25 L9.35 1.95 Z', fill: '#d8c8ff' },
      { d: 'M11.1 1.0 L9.25 1.4 L7.95 2.3 L7.65 3.25 L7.95 4.2 L9.25 5.1 L11.1 5.5 L9.35 4.3 L8.7 3.25 L9.35 2.2 Z', fill: '#f6f0ff', opacity: 0.82 },
    ],
  },
  copper_wand: {
    paths: [
      { d: 'M7.7 3.15 L8.3 3.15 L8.85 14.55 L7.15 14.55 Z', fill: '#b85c2a' },
      { d: 'M7.85 3.25 L8.15 3.25 L8.5 14.15 L7.5 14.15 Z', fill: '#e8a05a', opacity: 0.75 },
      { d: 'M7.05 6.4 H8.95 V7.2 H7.05 Z', fill: '#e2c04a' },
      { d: 'M7.05 10.7 H8.95 V12.4 H7.05 Z', fill: '#e2c04a' },
      { d: 'M7.2 10.9 H8.8 V12.2 H7.2 Z', fill: '#b85c2a', opacity: 0.45 },
      { d: 'M8 0.2 A1.85 1.85 0 1 1 8 3.9 A1.85 1.85 0 1 1 8 0.2', fill: '#3ec8b0', opacity: 0.32 },
      { d: 'M8 0.45 A1.55 1.55 0 1 1 8 3.55 A1.55 1.55 0 1 1 8 0.45', fill: '#4ad4c0' },
      { d: 'M8 0.95 A1 1 0 1 1 8 2.95 A1 1 0 1 1 8 0.95', fill: '#e8fffa', opacity: 0.75 },
      { d: 'M8.35 1.15 A0.4 0.4 0 1 1 8.35 1.95 A0.4 0.4 0 1 1 8.35 1.15', fill: '#ffffff', opacity: 0.8 },
    ],
  },
  copper_staff: {
    viewBox: '0 0 16 26',
    paths: [
      { d: 'M7.15 5.4 L8.85 5.4 L9.4 25.4 L6.6 25.4 Z', fill: '#a85022' },
      { d: 'M7.35 5.6 L8.65 5.6 L9.05 24.7 L6.95 24.7 Z', fill: '#e8a05a', opacity: 0.7 },
      { d: 'M5.5 3.3 H10.5 V4.15 H5.5 Z', fill: '#e2c04a' },
      { d: 'M5.85 4.15 H10.15 V6.7 H5.85 Z', fill: '#c46830' },
      { d: 'M6.4 4.55 H9.6 V6.3 H6.4 Z', fill: '#e8a05a' },
      { d: 'M8 0.15 A2.35 2.35 0 1 1 8 4.85 A2.35 2.35 0 1 1 8 0.15', fill: '#3ec8b0', opacity: 0.3 },
      { d: 'M8 0.45 A2 2 0 1 1 8 4.45 A2 2 0 1 1 8 0.45', fill: '#4ad4c0' },
      { d: 'M8 1.15 A1.25 1.25 0 1 1 8 3.65 A1.25 1.25 0 1 1 8 1.15', fill: '#e8fffa', opacity: 0.72 },
      { d: 'M8.55 1.4 A0.5 0.5 0 1 1 8.55 2.4 A0.5 0.5 0 1 1 8.55 1.4', fill: '#ffffff', opacity: 0.8 },
    ],
  },
}

const MATERIAL: IconDef = {
  paths: [
    { d: 'M4 10.5 L8 3.5 L12 10.5 Z', fill: '#8a7a60' },
    { d: 'M5.2 10.5 L8 5.4 L10.8 10.5 Z', fill: '#b0a080', opacity: 0.7 },
  ],
}

const KIND_FALLBACK: Record<string, IconDef> = {
  weapon: ICONS.dagger ?? MATERIAL,
  tool: ICONS.hatchet ?? MATERIAL,
  armor: ICONS.leather_belt ?? MATERIAL,
  consumable: ICONS.rose_stew ?? MATERIAL,
  key: ICONS.chest_key ?? MATERIAL,
  material: MATERIAL,
}

function resolveIcon(slug: string, kind?: string | null): IconDef {
  return ICONS[slug] ?? (kind ? KIND_FALLBACK[kind] : undefined) ?? MATERIAL
}

function viewBoxSize(box: string) {
  const parts = box.trim().split(/\s+/)
  const width = Number(parts[2])
  const height = Number(parts[3])
  return {
    width: Number.isFinite(width) && width > 0 ? width : 16,
    height: Number.isFinite(height) && height > 0 ? height : 16,
  }
}

/** Two-handers use a taller glyph; scene overlays should keep the tip and grow the butt. */
export function itemIconIsLong(slug: string, kind?: string | null) {
  const size = viewBoxSize(resolveIcon(slug, kind).viewBox ?? '0 0 16 16')
  return size.height > size.width + 2
}

/** Bare glyph for embedding in another SVG. Origin is the visual center. */
export function ItemGlyph({
  slug,
  kind,
  size = 16,
}: {
  slug: string
  kind?: string | null
  size?: number
}) {
  const icon = resolveIcon(slug, kind)
  const viewBox = icon.viewBox ?? '0 0 16 16'
  const { width, height } = viewBoxSize(viewBox)
  const scale = size / height
  const w = width * scale
  const h = height * scale
  return (
    <g className={`item-glyph item-icon-${slug}`} transform={`translate(${-w / 2} ${-h / 2}) scale(${scale})`}>
      <g transform={icon.transform}>
        {icon.paths.map((path, i) => (
          <path key={i} d={path.d} fill={path.fill ?? 'currentColor'} opacity={path.opacity ?? 1} />
        ))}
      </g>
    </g>
  )
}

export function ItemIcon({
  slug,
  kind,
  name,
  size = 40,
}: {
  slug: string
  kind?: string | null
  name?: string
  size?: number
}) {
  const icon = resolveIcon(slug, kind)
  const viewBox = icon.viewBox ?? '0 0 16 16'

  return (
    <svg
      className={`item-icon item-icon-${slug}${itemIconIsLong(slug, kind) ? ' is-long' : ''}`}
      width={size}
      height={size}
      viewBox={viewBox}
      aria-hidden={name ? undefined : true}
      role={name ? 'img' : undefined}
      aria-label={name}
    >
      {name ? <title>{name}</title> : null}
      <g transform={icon.transform}>
        {icon.paths.map((path, i) => (
          <path key={i} d={path.d} fill={path.fill ?? 'currentColor'} opacity={path.opacity ?? 1} />
        ))}
      </g>
    </svg>
  )
}
