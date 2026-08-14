import './style.css'
import { pageSections, scrollGroups } from './pageSections'
import { renderDummySection } from './sections/dummySection'
import { buildGroupedScrollSection } from './sections/groupedScrollMarkup'
import { initGroupedScroll } from './sections/groupedScrollGSAP'
import { enableDragToScroll } from './sections/dragScroll'
import { initSmoothScroll } from './sections/smoothScroll'

function renderApp(root: HTMLElement) {
  for (const section of pageSections) {
    if (section.type === 'dummy') {
      root.append(renderDummySection(section.data))
      continue
    }

    const refs = buildGroupedScrollSection(section.id, scrollGroups)
    root.append(refs.wrapper)
    initGroupedScroll(refs)

    // Tablet/Mobile에서는 섹션별 카드 리스트가 각자 독립적인 가로 스크롤 영역이라,
    // 섹션마다 마우스 클릭+드래그 스크롤을 따로 붙인다.
    refs.groups.forEach((group) => enableDragToScroll(group.cardsEl))
  }
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root element not found')

initSmoothScroll()
renderApp(app)
