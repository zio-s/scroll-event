import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { GroupedScrollRefs } from './groupedScrollMarkup'
import { PC_MIN_WIDTH } from './breakpoint'

gsap.registerPlugin(ScrollTrigger)

/**
 * 하나의 pin 안에서 여러 섹션(카드 그룹)이 끊김 없이 이어지는 가로 스크롤.
 *
 * - 카드 트랙 전체를 translateX 하나로 미는 건 기존과 같다.
 * - 타이틀은 "카운터 스크롤" 트릭으로 고정처럼 보이게 만든다: 트랙이 -scrollX만큼
 *   움직이는 동안, 그 섹션의 헤더에는 반대로 +scrollX만큼(자기 섹션 폭 안에서만)
 *   보정을 걸어서 두 이동이 상쇄되어 화면에서는 좌측 padding 라인에 멈춰 있는
 *   것처럼 보인다. 보정 한도(headerMaxShift)를 넘어서면(=섹션이 거의 다 지나가면)
 *   더 이상 상쇄가 안 되니 카드처럼 화면 밖으로 밀려난다.
 * - 세로 중앙 정렬 기준(centerOffset)은 pin 전체가 아니라 첫 섹션 카드 로우의 중앙이다.
 */
export function initGroupedScroll(refs: GroupedScrollRefs): () => void {
  const { wrapper, pin, viewport, track, groups } = refs
  const mm = gsap.matchMedia()

  mm.add(`(min-width: ${PC_MIN_WIDTH}px)`, () => {
    groups.forEach((g) => {
      g.cardsEl.scrollLeft = 0
    })

    // 섹션 박스가 flex-direction:column 안에 텍스트(헤더)와 고정폭 카드 로우를 같이
    // 담고 있으면, "내용에 맞춰 줄어드는 폭"을 브라우저마다 다르게 계산해서(Safari가
    // 특히) 섹션 사이에 의도치 않은 간격이 생긴다. 카드 로우의 실제 렌더링 폭을 재서
    // 섹션 박스 폭에 그대로 못박아 이 차이를 없앤다.
    //
    // cardsEl(.h-scroll-section-cards) 자신의 getBoundingClientRect()는 쓰지 않는다 —
    // 이 요소는 매 refresh마다 우리가 직접 width를 씌웠다 지웠다 하는 대상이라,
    // Safari에서는 style.width=''로 지운 직후 같은 틱에 다시 측정해도 이전에 씌운
    // 값이 완전히 반영 해제되기 전 상태를 읽어와 refresh를 거듭할수록 값이 부풀려질
    // 수 있다. 대신 우리가 폭을 건드린 적 없는 개별 .h-card들의 첫 번째~마지막
    // 좌우 끝 좌표로 직접 계산하면 이전 강제값이 남아있을 여지가 없다.
    function lockSectionWidths() {
      groups.forEach((g) => {
        g.el.style.width = ''
        const cards = g.cardsEl.querySelectorAll<HTMLElement>('.h-card')
        const first = cards[0]
        const last = cards[cards.length - 1]
        if (!first || !last) return
        const width = last.getBoundingClientRect().right - first.getBoundingClientRect().left
        g.el.style.width = `${width}px`
      })
    }

    // entryOffset[i]: 이 섹션의 헤더가 "고정 지점(padding 라인)"에 도착하는 데
    // 필요한 scrollX 값. headerMaxShift[i]: 고정 지점에서 버틸 수 있는 최대 보정량
    // (섹션 폭 - 헤더 폭) — 이걸 넘어서면 더 못 버티고 카드처럼 밀려난다.
    const entryOffset: number[] = []
    const headerMaxShift: number[] = []

    function measureHeaders() {
      const trackRect = track.getBoundingClientRect()
      const sectionStartX = groups.map((g) => {
        g.headerEl.style.transform = ''
        return g.el.getBoundingClientRect().left - trackRect.left
      })
      // 고정 지점(padding 라인)은 트랙의 시작 padding, 곧 첫 섹션이 자연 상태로
      // 놓이는 자리다. 다른 섹션들은 이 지점 대비 얼마나 더 가야 하는지로 계산한다.
      const paddingX = sectionStartX[0]
      groups.forEach((g, i) => {
        entryOffset[i] = sectionStartX[i] - paddingX
        const sectionRect = g.el.getBoundingClientRect()
        const headerRect = g.headerEl.getBoundingClientRect()
        headerMaxShift[i] = Math.max(0, sectionRect.width - headerRect.width)
      })
    }

    // scrollWidth/clientWidth는 정수로 반올림된 값이라, 카드 15장 + 큰 gap을 거치며
    // 브라우저마다(특히 Safari) 반올림 오차가 누적되면 전체 스크롤 거리 자체가 몇 px
    // 어긋나 "카드는 끝났는데 스크롤은 더 남아있는" 현상이 생긴다.
    //
    // track 자신의 getBoundingClientRect().width는 쓸 수 없다 — track은 block 레벨
    // display:flex라 자식이 넘치더라도(overflow) 박스 자체 폭은 그냥 부모(viewport)
    // 폭을 그대로 채운다(width:auto의 기본 동작). 대신 "마지막 카드의 오른쪽 끝"과
    // "track의 왼쪽 끝"을 직접 재서 그 차이를 쓴다 — 이 둘은 같은 translateX 아래
    // 있어서 현재 변형(transform) 값과 무관하게 항상 같은 결과가 나온다(상쇄).
    const getScrollLength = () => {
      const trackRect = track.getBoundingClientRect()
      const viewportRect = viewport.getBoundingClientRect()
      const lastGroup = groups[groups.length - 1]
      const cards = lastGroup.cardsEl.querySelectorAll<HTMLElement>('.h-card')
      const lastCard = cards[cards.length - 1]
      if (!lastCard) return 0
      const lastCardRect = lastCard.getBoundingClientRect()
      const trackPaddingRight = parseFloat(getComputedStyle(track).paddingRight) || 0
      const naturalContentRight = lastCardRect.right - trackRect.left + trackPaddingRight
      return Math.max(0, naturalContentRight - viewportRect.width)
    }

    const tween = gsap.to(track, {
      x: () => -getScrollLength(),
      ease: 'none',
    })

    const getStart = () => {
      const pinRect = pin.getBoundingClientRect()
      const cardsRect = groups[0].cardsEl.getBoundingClientRect()
      const centerOffset = cardsRect.top - pinRect.top + cardsRect.height / 2
      return `top+=${centerOffset} center`
    }

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      pin,
      start: getStart,
      end: () => `+=${getScrollLength()}`,
      scrub: true,
      invalidateOnRefresh: true,
      onRefreshInit: lockSectionWidths,
      onRefresh: measureHeaders,
      onUpdate(self) {
        const scrollX = getScrollLength() * self.progress
        groups.forEach((g, i) => {
          const localX = scrollX - entryOffset[i]
          const shift = Math.min(Math.max(localX, 0), headerMaxShift[i])
          g.headerEl.style.transform = `translateX(${shift}px)`
        })
      },
      animation: tween,
    })

    lockSectionWidths()
    measureHeaders()

    return () => {
      trigger.kill()
      tween.kill()
      groups.forEach((g) => {
        g.cardsEl.scrollLeft = 0
        g.el.style.width = ''
        g.headerEl.style.transform = ''
      })
    }
  })

  window.addEventListener('load', () => ScrollTrigger.refresh())

  return function destroy() {
    mm.revert()
  }
}
