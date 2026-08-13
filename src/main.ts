import './style.css'
import { dummySections } from './data/dummy'
import { horizontalSections } from './data/cards'
import { renderDummySection } from './sections/dummySection'
import { buildHorizontalSection } from './sections/horizontalMarkup'
import { initVanillaHorizontalScroll } from './sections/horizontalScrollVanilla'
import { initGsapHorizontalScroll } from './sections/horizontalScrollGSAP'
import { enableDragToScroll } from './sections/dragScroll'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root element not found')

// 페이지 흐름: [더미] → [가로 스크롤 A: Vanilla] → [더미] → [가로 스크롤 B: GSAP] → [더미]
const sectionA = buildHorizontalSection(horizontalSections[0])
const sectionB = buildHorizontalSection(horizontalSections[1])

app.append(
  renderDummySection(dummySections[0]),
  sectionA.wrapper,
  renderDummySection(dummySections[1]),
  sectionB.wrapper,
  renderDummySection(dummySections[2]),
)

// 두 번째 섹션의 트리거 위치 계산은 첫 번째 섹션이 이미 문서 높이를 반영한 뒤에
// 이뤄져야 정확하므로, DOM에 전부 append한 뒤 순서대로 초기화한다.
initVanillaHorizontalScroll(sectionA)
initGsapHorizontalScroll(sectionB)

// Tablet/Mobile에서 마우스 클릭+드래그로도 카드 리스트를 스크롤할 수 있게 한다.
enableDragToScroll(sectionA.viewport)
enableDragToScroll(sectionB.viewport)
