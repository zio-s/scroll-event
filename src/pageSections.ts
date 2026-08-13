import type { DummySectionData } from './data/dummy'
import type { HorizontalSectionData } from './data/cards'
import { dummySections } from './data/dummy'
import { horizontalSections } from './data/cards'

export type PageSectionConfig =
  | { type: 'dummy'; data: DummySectionData }
  | { type: 'horizontal'; engine: 'vanilla' | 'gsap'; data: HorizontalSectionData }

// 페이지에 실제로 렌더링되는 섹션 순서. 가로 스크롤 섹션을 하나 더 넣고 싶으면
// (필요하면 앞뒤에 더미 섹션과 함께) 이 배열에 항목만 추가하면 된다 — main.ts는
// 건드릴 필요 없다.
export const pageSections: PageSectionConfig[] = [
  { type: 'dummy', data: dummySections[0] },
  { type: 'horizontal', engine: 'vanilla', data: horizontalSections[0] },
  { type: 'dummy', data: dummySections[1] },
  { type: 'horizontal', engine: 'gsap', data: horizontalSections[1] },
  { type: 'dummy', data: dummySections[2] },
]
