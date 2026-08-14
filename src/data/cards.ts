export interface CardData {
  id: string
  eyebrow: string
  title: string
  emoji: string
  colorFrom: string
  colorTo: string
}

// 하나의 가로 스크롤 하이재킹 안에서 이어지는 "섹션" 하나. 여러 개가 순서대로
// 이어지고(섹션1 카드들 → 섹션2 카드들 → ...), 각자 자기 카드 구간이 지나가는
// 동안에만 타이틀이 좌측에 고정된다.
export interface ScrollGroupData {
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

const EMOJIS = ['🖨️', '👷', '⚖️', '🏥', '🏭', '🎓', '🏦', '🚚', '🛒', '💼']

function buildCards(prefix: string, label: string, count: number): CardData[] {
  return Array.from({ length: count }, (_, i) => {
    const [colorFrom, colorTo] = PALETTE[i % PALETTE.length]
    return {
      id: `${prefix}-${i + 1}`,
      eyebrow: `2026.0${(i % 9) + 1}.1${i}`,
      title: `${label} ${i + 1} — 더미 타이틀 텍스트가 두 줄까지 노출됩니다`,
      emoji: EMOJIS[i % EMOJIS.length],
      colorFrom,
      colorTo,
    }
  })
}

// 섹션 수(배열 길이), 카드 수(각 섹션의 cards 길이)는 여기 배열만 늘리면 자동으로
// 반영됩니다. README '섹션 수, 카드 수 추가하는 방법' 참고.
export const scrollGroups: ScrollGroupData[] = [
  {
    id: 'group-industry',
    eyebrow: 'Case Study',
    title: '산업별 도입 사례',
    description: '산업별 맞춤 솔루션으로 성과를 낸 사례를 소개합니다.',
    cards: buildCards('industry', '산업별 도입 사례', 5),
  },
  {
    id: 'group-client',
    eyebrow: 'Client',
    title: '고객사 도입 사례',
    description: '다양한 규모의 고객사가 함께 만든 변화를 확인해보세요.',
    cards: buildCards('client', '고객사 도입 사례', 4),
  },
  {
    id: 'group-news',
    eyebrow: 'News',
    title: '기업 소식',
    description: '새로운 가치를 만드는 이야기를 전해드립니다.',
    cards: buildCards('news', '기업 소식', 6),
  },
  {
    id: 'group-section-test',
    eyebrow: 'Section',
    title: '섹션 추가 사례',
    description: '섹션 10개 이상 추가를 하여도 문제가 없음을 확인 하였습니다.',
    cards: buildCards('section', '섹션 추가', 3),
  },
  {
    id: 'group-cards-test',
    eyebrow: 'Cards',
    title: '카드 추가 사례',
    description: '섹션의 카드가 10장 이상인 경우 테스트 문제가 없음을 확인 하였습니다.',
    cards: buildCards('cards', '카드 추가 15개', 15),
  },
]
