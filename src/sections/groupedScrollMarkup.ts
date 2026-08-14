import type { ScrollGroupData } from '../data/cards'

export interface GroupRefs {
  el: HTMLElement
  headerEl: HTMLElement
  cardsEl: HTMLElement
  data: ScrollGroupData
}

export interface GroupedScrollRefs {
  wrapper: HTMLElement
  pin: HTMLElement
  viewport: HTMLElement
  track: HTMLElement
  groups: GroupRefs[]
}

/** querySelector가 못 찾으면 마크업 자체가 깨졌다는 뜻이라, `!`로 넘기지 않고 바로 에러를 던진다. */
function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector)
  if (!el) throw new Error(`groupedScrollMarkup: "${selector}" not found`)
  return el
}

// 카드를 <a>로 감싸서 실제 서비스의 "카드 클릭 → 상세 페이지" 구조를 보여준다.
// 연결할 상세 페이지가 없어 href="#"만 두고 기본 이동은 아래서 막는다. <li>만
// 있을 땐 탭 순서에 안 들어왔는데 <a>라 탭 포커스 + aria-label이 생긴다.
function cardMarkup(card: ScrollGroupData['cards'][number]): string {
  return `
    <li class="h-card">
      <a class="h-card__link" href="#" aria-label="${card.title}">
        <div class="h-card__media" style="background: linear-gradient(155deg, ${card.colorFrom}, ${card.colorTo})">
          <span aria-hidden="true">${card.emoji}</span>
        </div>
        <p class="h-card__eyebrow">${card.eyebrow}</p>
        <h3 class="h-card__title">${card.title}</h3>
      </a>
    </li>
  `
}

function sectionMarkup(group: ScrollGroupData): string {
  return `
    <div class="h-scroll-section" data-section-id="${group.id}">
      <div class="h-scroll-section-header">
        <span class="h-scroll-badge">${group.eyebrow}</span>
        <h2 class="h-scroll-title">${group.title}</h2>
        <p class="h-scroll-desc">${group.description}</p>
      </div>
      <ul class="h-scroll-section-cards">
        ${group.cards.map(cardMarkup).join('')}
      </ul>
    </div>
  `
}

// 여러 섹션이 이어지는 가로 스크롤 마크업. PC는 트랙 전체가 통째로 translateX,
// Tablet/Mobile은 섹션별 세로 스택 + 독립 가로 스와이프(마크업은 동일, 레이아웃만
// 다름). 카운터 스크롤 로직은 groupedScrollGSAP.ts.
export function buildGroupedScrollSection(id: string, groups: ScrollGroupData[]): GroupedScrollRefs {
  const wrapper = document.createElement('section')
  wrapper.className = 'h-scroll-wrapper'
  wrapper.id = id
  wrapper.innerHTML = `
    <div class="h-scroll-pin">
      <div class="h-scroll-viewport">
        <div class="h-scroll-track">
          ${groups.map(sectionMarkup).join('')}
        </div>
      </div>
    </div>
  `

  const pin = query<HTMLElement>(wrapper, '.h-scroll-pin')
  const viewport = query<HTMLElement>(wrapper, '.h-scroll-viewport')
  const track = query<HTMLElement>(wrapper, '.h-scroll-track')

  const sectionEls = Array.from(track.querySelectorAll<HTMLElement>('.h-scroll-section'))
  const groupRefs: GroupRefs[] = sectionEls.map((sectionEl, i) => ({
    el: sectionEl,
    headerEl: query<HTMLElement>(sectionEl, '.h-scroll-section-header'),
    cardsEl: query<HTMLElement>(sectionEl, '.h-scroll-section-cards'),
    data: groups[i],
  }))

  // 상세 페이지가 없는 데모라 href="#"를 실제로 따라가면 페이지 최상단으로 튀어서
  // 가로 스크롤 흐름이 끊긴 것처럼 보인다. 클릭 시 기본 이동만 막고, <a> 자체가
  // 주는 탭 포커스/스크린리더 접근성 이름은 그대로 유지한다.
  track.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('.h-card__link')
    if (link) e.preventDefault()
  })

  return { wrapper, pin, viewport, track, groups: groupRefs }
}
