import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { GroupedScrollRefs } from './groupedScrollMarkup'
import { PC_MIN_WIDTH } from './breakpoint'

gsap.registerPlugin(ScrollTrigger)

// 여러 섹션(카드 그룹)이 하나의 pin 안에서 끊김 없이 이어지는 가로 스크롤 엔진.
// 트랙 전체를 translateX로 밀고, 타이틀은 카운터 스크롤(아래 onUpdate)로 좌측
// padding 라인에 붙잡아뒀다가 섹션이 끝날 때만 카드처럼 밀려나가게 한다.
export function initGroupedScroll(refs: GroupedScrollRefs): () => void {
  const { wrapper, pin, viewport, track, groups } = refs
  const mm = gsap.matchMedia()

  mm.add(`(min-width: ${PC_MIN_WIDTH}px)`, () => {
    groups.forEach((g) => {
      g.cardsEl.scrollLeft = 0
    })

    // 섹션 박스 폭을 카드 로우 실측 폭에 못박는다 — flex-direction:column 안에서
    // shrink-to-fit 계산이 브라우저마다 달라(Safari) 섹션 사이 간격이 어긋나서다.
    // cardsEl 자신을 재는 대신 카드들 좌우 끝으로 계산하는 이유: cardsEl은 매
    // refresh마다 우리가 width를 씌웠다 지우는 대상이라, Safari에서 style.width=''
    // 직후 같은 틱에 재도 이전 값이 덜 빠진 채로 읽혀 refresh할수록 부풀려진다.
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

    // scrollWidth 기반 정수 반올림이 Safari에서 누적돼 "카드는 끝났는데 스크롤은
    // 남는" 문제가 있었다. track 자신의 rect.width도 못 쓴다 — block-flex라 자식이
    // 넘쳐도 박스 폭은 부모(viewport) 폭 그대로다. 대신 마지막 카드 오른쪽 끝과
    // track 왼쪽 끝의 차이로 계산한다(같은 transform 아래라 언제 재도 값이 같다).
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
