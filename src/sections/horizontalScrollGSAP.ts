import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { HorizontalSectionRefs } from './horizontalMarkup'
import { PC_MIN_WIDTH } from './breakpoint'

gsap.registerPlugin(ScrollTrigger)

// horizontalScrollVanilla.ts와 같은 결과를 GSAP ScrollTrigger로 만든다.
// start: "center center" 하나로 vanilla 쪽 triggerY 계산식이 통째로 필요 없어지고,
// end를 함수로 넘기고 invalidateOnRefresh를 켜두면 리사이즈 재계산도 알아서 된다.
// gsap.matchMedia()로 PC(1025px~)에서만 켜고, 벗어나면 아래 return 함수가 pin/transform을
// 원상복구해서 CSS 네이티브 스와이프로 넘어간다.
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
