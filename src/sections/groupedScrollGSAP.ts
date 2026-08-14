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
    function lockSectionWidths() {
      groups.forEach((g) => {
        g.el.style.width = ''
        g.el.style.width = `${g.cardsEl.scrollWidth}px`
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

    const getScrollLength = () => Math.max(0, track.scrollWidth - viewport.clientWidth)

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
