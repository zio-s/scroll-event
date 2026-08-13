export interface CardData {
  id: string
  eyebrow: string
  title: string
  emoji: string
  colorFrom: string
  colorTo: string
}

export interface HorizontalSectionData {
  id: string
  eyebrow: string
  title: string
  description: string
  cards: CardData[]
}

const PALETTE: Array<[string, string]> = [
  ['#c9c2f0', '#a89ce8'],
  ['#bfe6d0', '#93d1ac'],
  ['#f6d9b0', '#eeb96e'],
  ['#f3c6c6', '#e59a9a'],
  ['#c3e0f5', '#8fc2e8'],
  ['#f5e2a8', '#e8c766'],
]

const EMOJIS = ['🖨️', '👷', '⚖️', '🏥', '🏭', '🎓', '🏦', '🚚', '🛒']

function buildCards(prefix: string, count: number): CardData[] {
  return Array.from({ length: count }, (_, i) => {
    const [colorFrom, colorTo] = PALETTE[i % PALETTE.length]
    return {
      id: `${prefix}-${i + 1}`,
      eyebrow: `2026.0${(i % 9) + 1}.1${i}`,
      title: `${prefix === 'a' ? '산업별' : '고객사'} 도입 사례 ${i + 1} — 더미 타이틀 텍스트가 두 줄까지 노출됩니다`,
      emoji: EMOJIS[i % EMOJIS.length],
      colorFrom,
      colorTo,
    }
  })
}

// 섹션 수/카드 수는 이 배열만 늘리면 레이아웃이 자동으로 대응합니다.
// README '섹션 수, 카드 수 추가하는 방법' 참고.
export const horizontalSections: HorizontalSectionData[] = [
  {
    id: 'section-a',
    eyebrow: 'Vanilla JS',
    title: '산업별 도입 사례',
    description: '외부 라이브러리 없이 직접 구현한 가로 스크롤 카드 섹션입니다.',
    cards: buildCards('a', 9),
  },
  {
    id: 'section-b',
    eyebrow: 'GSAP ScrollTrigger',
    title: '고객사 도입 사례',
    description: 'GSAP ScrollTrigger의 pin + scrub으로 구현한 가로 스크롤 카드 섹션입니다.',
    cards: buildCards('b', 7),
  },
]
