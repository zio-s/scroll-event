import type { DummySectionData } from './data/dummy'
import { dummySections } from './data/dummy'
import { scrollGroups } from './data/cards'

export type PageSectionConfig =
  | { type: 'dummy'; data: DummySectionData }
  | { type: 'scroll'; id: string }

// 페이지에 실제로 렌더링되는 순서. 가로 스크롤 섹션은 하나이고, 그 안의 그룹/카드
// 수는 src/data/cards.ts의 scrollGroups 배열만 늘리면 자동으로 반영된다.
export const pageSections: PageSectionConfig[] = [
  { type: 'dummy', data: dummySections[0] },
  { type: 'scroll', id: 'scroll-section' },
  { type: 'dummy', data: dummySections[1] },
]

export { scrollGroups }
