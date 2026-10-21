export const BODY_TYPES = [
  { slug: 'body1', name: 'Body 1' },
  { slug: 'body2', name: 'Body 2' },
  { slug: 'body3', name: 'Body 3' },
  { slug: 'body4', name: 'Body 4' },
  { slug: 'body5', name: 'Body 5' },
  { slug: 'body6', name: 'Body 6' },
  { slug: 'body7', name: 'Body 7' },
  { slug: 'body8', name: 'Body 8' },
  { slug: 'body9', name: 'Body 9' },
  { slug: 'body10', name: 'Body 10' },
] as const

export type BodyType = (typeof BODY_TYPES)[number]['slug']

export type BodyPaths = {
  robe: string
  trim: string
}

const BODIES: Record<BodyType, { sheet: BodyPaths; scene: BodyPaths }> = {
  body1: {
    sheet: {
      robe: 'M28 128 C28 78 92 78 92 128 Z',
      trim: 'M40 86 C44 70 76 70 80 86 L76 128 H44 Z',
    },
    scene: {
      robe: 'M30 76 C32 66 88 66 90 76 L93 96 L86 112 L80 130 H40 L34 112 L27 96 Z',
      trim: 'M40 78 C42 70 78 70 80 78 L83 96 L76 112 L72 130 H48 L44 112 L37 96 Z',
    },
  },
  body2: {
    sheet: {
      robe: 'M30 128 C30 78 90 78 90 128 Z',
      trim: 'M42 86 C46 70 74 70 78 86 L74 128 H46 Z',
    },
    scene: {
      robe: 'M32 76 C34 66 86 66 88 76 L85 96 L84 112 L78 130 H42 L36 112 L35 96 Z',
      trim: 'M42 78 C44 70 76 70 78 78 L77 96 L74 112 L70 130 H50 L46 112 L43 96 Z',
    },
  },
  body3: {
    sheet: {
      robe: 'M26 128 C26 80 94 80 94 128 Z',
      trim: 'M38 88 C42 76 78 76 82 88 L78 128 H42 Z',
    },
    scene: {
      robe: 'M28 78 C30 70 90 70 92 78 L94 100 L86 116 L80 130 H40 L34 116 L26 100 Z',
      trim: 'M38 80 C40 74 80 74 82 80 L84 100 L78 116 L72 130 H48 L42 116 L36 100 Z',
    },
  },
  body4: {
    sheet: {
      robe: 'M36 128 C36 76 84 76 84 128 Z',
      trim: 'M46 84 C50 68 70 68 74 84 L70 128 H50 Z',
    },
    scene: {
      robe: 'M38 74 C40 64 80 64 82 74 L80 96 L78 114 L74 130 H46 L42 114 L40 96 Z',
      trim: 'M46 76 C48 68 72 68 74 76 L72 96 L70 114 L66 130 H54 L50 114 L48 96 Z',
    },
  },
  body5: {
    sheet: {
      robe: 'M36 128 C20 74 100 74 84 128 Z',
      trim: 'M44 86 C36 70 84 70 76 86 L72 128 H48 Z',
    },
    scene: {
      robe: 'M22 72 C26 62 94 62 98 72 L86 98 L80 116 L76 130 H44 L40 116 L34 98 Z',
      trim: 'M34 74 C38 66 82 66 86 74 L78 98 L74 116 L70 130 H50 L46 116 L42 98 Z',
    },
  },
  body6: {
    sheet: {
      robe: 'M46 128 C32 86 32 76 60 74 C88 76 88 86 74 128 Z',
      trim: 'M50 88 C44 76 76 76 70 88 L68 128 H52 Z',
    },
    scene: {
      robe: 'M31 82 C31 74 42 70 60 70 C78 70 89 74 89 82 C86 92 80 100 76 110 C74 120 73 126 72 130 H48 C47 126 46 120 44 110 C40 100 34 92 31 82 Z',
      trim: 'M41 82 C41 76 48 74 60 74 C72 74 79 76 79 82 C76 92 72 102 70 112 C69 120 68 126 68 130 H52 C52 126 51 120 50 112 C48 102 44 92 41 82 Z',
    },
  },
  body7: {
    sheet: {
      robe: 'M28 128 C36 112 42 100 44 90 C30 74 90 74 76 90 C78 100 84 112 92 128 Z',
      trim: 'M40 88 C36 74 84 74 80 88 C78 104 82 116 84 128 H36 C38 116 42 104 40 88 Z',
    },
    scene: {
      robe: 'M33 80 C33 72 44 69 60 69 C76 69 87 72 87 80 C88 94 80 106 76 112 C84 118 92 124 93 130 H27 C28 124 36 118 44 112 C40 106 32 94 33 80 Z',
      trim: 'M44 80 C44 74 50 72 60 72 C70 72 76 74 76 80 C78 94 72 106 70 112 C76 118 80 124 82 130 H38 C40 124 44 118 50 112 C48 106 42 94 44 80 Z',
    },
  },
  body8: {
    sheet: {
      robe: 'M22 128 C34 112 40 100 42 90 C32 76 88 76 78 90 C80 100 86 112 98 128 Z',
      trim: 'M38 88 C34 76 86 76 82 88 C80 104 86 116 88 128 H32 C34 116 40 104 38 88 Z',
    },
    scene: {
      robe: 'M36 81 C36 73 46 70 60 70 C74 70 84 73 84 81 C90 96 82 108 78 112 C88 118 98 124 100 130 H20 C22 124 32 118 42 112 C38 108 30 96 36 81 Z',
      trim: 'M46 81 C46 75 52 73 60 73 C68 73 74 75 74 81 C78 96 72 108 70 112 C78 118 84 124 86 130 H34 C36 124 42 118 50 112 C48 108 42 96 46 81 Z',
    },
  },
  body9: {
    sheet: {
      robe: 'M46 128 C44 112 44 100 44 90 C30 74 90 74 76 90 C76 100 76 112 74 128 Z',
      trim: 'M50 88 C36 74 84 74 70 88 L68 128 H52 Z',
    },
    scene: {
      robe: 'M33 80 C33 72 44 69 60 69 C76 69 87 72 87 80 C88 94 80 106 76 112 C75 120 75 126 75 130 H45 C45 126 45 120 44 112 C40 106 32 94 33 80 Z',
      trim: 'M44 80 C44 74 50 72 60 72 C70 72 76 74 76 80 C78 94 72 106 70 112 C69 120 69 126 69 130 H51 C51 126 51 120 50 112 C48 106 42 94 44 80 Z',
    },
  },
  body10: {
    sheet: {
      robe: 'M42 128 C42 112 42 100 42 90 C32 76 88 76 78 90 C78 100 78 112 78 128 Z',
      trim: 'M48 88 C34 76 86 76 72 88 L70 128 H50 Z',
    },
    scene: {
      robe: 'M36 81 C36 73 46 70 60 70 C74 70 84 73 84 81 C90 96 82 108 78 112 C77 120 77 126 77 130 H43 C43 126 43 120 42 112 C38 108 30 96 36 81 Z',
      trim: 'M46 81 C46 75 52 73 60 73 C68 73 74 75 74 81 C78 96 72 108 70 112 C69 120 69 126 69 130 H51 C51 126 51 120 50 112 C48 108 42 96 46 81 Z',
    },
  },
}

export function parseBody(value: unknown): BodyType {
  return BODY_TYPES.some((row) => row.slug === value) ? (value as BodyType) : 'body1'
}

export function bodyName(style: BodyType) {
  return BODY_TYPES.find((row) => row.slug === style)?.name ?? 'Body 1'
}

export function bodyPaths(style: BodyType, scene: boolean): BodyPaths {
  const cut = BODIES[style]
  return scene ? cut.scene : cut.sheet
}
