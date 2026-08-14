import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PC_MIN_WIDTH } from './breakpoint'

gsap.registerPlugin(ScrollTrigger)

// 마우스 휠 입력은 그 자체로 뚝뚝 끊겨서 들어온다. Lenis가 이걸 이징으로 보간해서
// window 스크롤 위치를 부드럽게 갱신해주니, GSAP는 scrollY만 그대로 읽으면 된다
// (참고 사이트도 같은 조합). Tablet/Mobile은 네이티브 터치 스크롤로 이미 충분하고
// 카드 리스트도 overflow-x라 여기서는 꺼둔다.
export function initSmoothScroll() {
  let lenis: Lenis | null = null
  let rafId: number | null = null

  // lenis.stop()은 "네이티브로 되돌린다"가 아니라 "스크롤 자체를 잠근다"는 뜻이라
  // (모달 뒤 배경 스크롤 방지용 API) 모바일에서 이걸 쓰면 스크롤이 아예 안 된다.
  // 네이티브 스크롤로 완전히 돌려주려면 destroy()로 인스턴스 자체를 없애야 한다.
  function start() {
    if (lenis) return
    lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    })
    lenis.on('scroll', ScrollTrigger.update)

    function raf(time: number) {
      lenis?.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
  }

  function stop() {
    if (!lenis) return
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    lenis.destroy()
    lenis = null
  }

  function syncWithBreakpoint() {
    if (window.innerWidth >= PC_MIN_WIDTH) {
      start()
    } else {
      stop()
    }
  }
  syncWithBreakpoint()
  window.addEventListener('resize', syncWithBreakpoint)
}
