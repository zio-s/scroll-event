import './style.css'
import { pageSections } from './pageSections'
import { renderDummySection } from './sections/dummySection'
import { buildHorizontalSection } from './sections/horizontalMarkup'
import type { HorizontalSectionRefs } from './sections/horizontalMarkup'
import { initVanillaHorizontalScroll } from './sections/horizontalScrollVanilla'
import { initGsapHorizontalScroll } from './sections/horizontalScrollGSAP'
import { enableDragToScroll } from './sections/dragScroll'
import { initSmoothScroll } from './sections/smoothScroll'

initSmoothScroll()

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root element not found')

// pageSections.ts에 적힌 순서 그대로 DOM에 쌓는다. 가로 스크롤 섹션의 트리거 위치
// 계산은 앞선 섹션들이 이미 문서 높이를 반영한 뒤에 이뤄져야 정확하므로, 전부
// append한 뒤에 엔진을 한꺼번에 초기화한다.
const horizontalInits: Array<{ engine: 'vanilla' | 'gsap'; refs: HorizontalSectionRefs }> = []

for (const section of pageSections) {
  if (section.type === 'dummy') {
    app.append(renderDummySection(section.data))
  } else {
    const refs = buildHorizontalSection(section.data)
    app.append(refs.wrapper)
    horizontalInits.push({ engine: section.engine, refs })
  }
}

for (const { engine, refs } of horizontalInits) {
  if (engine === 'vanilla') {
    initVanillaHorizontalScroll(refs)
  } else {
    initGsapHorizontalScroll(refs)
  }
  // Tablet/Mobile에서 마우스 클릭+드래그로도 카드 리스트를 스크롤할 수 있게 한다.
  enableDragToScroll(refs.viewport)
}
