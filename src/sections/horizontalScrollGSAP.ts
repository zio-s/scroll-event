import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { HorizontalSectionRefs } from './horizontalMarkup'
import { PC_MIN_WIDTH } from './breakpoint'

gsap.registerPlugin(ScrollTrigger)

/**
 * GSAP ScrollTrigger로 구현한 동일 인터랙션.
 *
 * - pin + start: "center center" 옵션이 "섹션의 세로 중앙이 뷰포트 중앙에 닿는 시점에 고정"을
 *   그대로 지원해서, vanilla 버전에서 직접 계산했던 triggerY 공식이 필요 없다.
 * - end에 스크롤 진행 거리를 함수로 넘기고 invalidateOnRefresh: true를 켜면 리사이즈 시
 *   자동으로 재계산된다.
 * - gsap.matchMedia()로 PC(1025px 이상)에서만 활성화하고, Tablet/Mobile로 전환되면
 *   자동으로 pin/트랜스폼을 되돌려 CSS 기반 네이티브 스와이프로 자연스럽게 넘어간다.
 */
export function initGsapHorizontalScroll(refs: HorizontalSectionRefs): () => void {
  const { wrapper, pin, viewport, track } = refs
  const mm = gsap.matchMedia()

  mm.add(`(min-width: ${PC_MIN_WIDTH}px)`, () => {
    // 모바일(overflow-x: auto)에서 스와이프한 잔여 scrollLeft가 남아있으면 PC 모드의
    // translateX와 겹쳐서 카드 위치가 이중으로 밀린다. Safari는 overflow가 hidden으로
    // 바뀐 뒤에도 이 값을 Chrome보다 잘 보존해서 증상이 더 잘 드러난다.
    viewport.scrollLeft = 0

    const getScrollLength = () => Math.max(0, track.scrollWidth - viewport.clientWidth)

    const tween = gsap.to(track, {
      x: () => -getScrollLength(),
      ease: 'none',
    })

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      pin,
      start: 'center center',
      end: () => `+=${getScrollLength()}`,
      scrub: true,
      invalidateOnRefresh: true,
      animation: tween,
    })

    // gsap.matchMedia는 조건을 벗어날 때(=Tablet/Mobile 진입 시) 이 return 함수를 실행해
    // pin과 transform을 자동으로 되돌려준다.
    return () => {
      trigger.kill()
      tween.kill()
      viewport.scrollLeft = 0
    }
  })

  window.addEventListener('load', () => ScrollTrigger.refresh())

  return function destroy() {
    mm.revert()
  }
}
