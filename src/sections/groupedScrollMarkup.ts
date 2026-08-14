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

// 카드 전체를 <a>로 감싼다 — 실제 서비스라면 카드 클릭 시 상세 페이지로 이동하는
// 구조를 그대로 보여주기 위해서다. 이 데모에는 연결할 상세 페이지가 없어서
// href="#"로 두고, buildGroupedScrollSection에서 클릭 시 페이지 최상단으로
// 튀는 기본 동작만 막는다. <li>였을 때는 키보드 탭 순서에 아예 들어오지 않았는데,
// <a>가 되면서 탭 포커스 + 스크린리더 접근성 이름(aria-label)을 갖게 된다.
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

/**
 * 하나의 가로 스크롤 하이재킹 안에 여러 섹션(카드 그룹)이 이어지는 구조를 만든다.
 * 타이틀은 각 섹션에 딸린 콘텐츠지만, 자기 섹션이 지나가는 동안은 좌측 padding
 * 라인에 고정되어 있다가 섹션이 끝날 때만 카드와 함께 화면 밖으로 밀려난다(카운터
 * 스크롤은 groupedScrollGSAP.ts가 담당).
 *
 * - PC: 모든 섹션이 하나의 연속된 트랙으로 이어져서 통째로 translateX 된다.
 *   뷰포트는 화면 끝까지 꽉 차고(overflow:hidden), 시작 위치만 트랙의 padding으로
 *   맞춘다 — 그래야 카드가 padding 안쪽 여백으로 사라지지 않고 화면 가장자리까지
 *   찬 채로 스크롤된다.
 * - Tablet/Mobile: 섹션이 세로로 쌓이고, 섹션 안 카드 리스트는 각자 독립적인
 *   가로 스와이프가 된다(레이아웃만 다를 뿐 마크업은 동일).
 */
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
