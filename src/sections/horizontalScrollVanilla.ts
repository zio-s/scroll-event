import type { HorizontalSectionRefs } from './horizontalMarkup'

const PC_MIN_WIDTH = 1025
const RESIZE_DEBOUNCE_MS = 150

/**
 * 순수 JS로 구현한 "센터 트리거 가로 스크롤 하이재킹".
 *
 * 핵심 아이디어: wheel/touch 이벤트를 가로채서 preventDefault 하는 대신, 문서 흐름에
 * 스크롤 여유 공간(wrapper.height = pinHeight + scrollLength)을 확보해두고, 그 구간을
 * 지나는 동안 pin 요소를 fixed로 고정한 채 scrollY 변화량을 카드 트랙의 translateX로
 * 매핑한다. 이렇게 하면 트랙패드 관성 스크롤, 일반 휠, 키보드 스크롤이 모두 별도 처리
 * 없이 그대로 자연스럽게 동작한다.
 *
 * 3단계 상태:
 *  - before : scrollY < triggerY  → pin은 wrapper 상단에 일반 배치(absolute top:0)
 *  - pinned : triggerY <= scrollY <= releaseY → pin을 fixed(top:50%)로 화면 중앙에 고정,
 *             (scrollY - triggerY)를 진행률로 환산해 카드 트랙을 가로로 이동
 *  - after  : scrollY > releaseY → pin은 wrapper 하단에 배치되어 다음 콘텐츠로 자연스럽게 이어짐
 *
 * triggerY는 "wrapper 상단이 뷰포트에 닿는 시점"이 아니라 "pin의 세로 중앙이 뷰포트
 * 세로 중앙과 일치하는 시점"으로 계산한다(과제 1-2 트리거 조건).
 */
export function initVanillaHorizontalScroll(refs: HorizontalSectionRefs): () => void {
  const { wrapper, pin, viewport, track } = refs

  let enabled = false
  let scrollLength = 0
  let triggerY = 0
  let releaseY = 0
  let rafId: number | null = null
  let resizeTimer: number | undefined

  const isPC = () => window.innerWidth >= PC_MIN_WIDTH

  function resetInlineStyles() {
    wrapper.style.height = ''
    pin.style.position = ''
    pin.style.top = ''
    pin.style.left = ''
    pin.style.right = ''
    pin.style.width = ''
    pin.style.transform = ''
    track.style.transform = ''
  }

  function measure() {
    // 실제 콘텐츠 크기를 재는 동안에는 static으로 되돌려 이전 fixed/absolute 상태가
    // 측정값에 영향을 주지 않도록 한다.
    pin.style.position = 'static'
    pin.style.transform = ''
    track.style.transform = ''

    const pinHeight = pin.offsetHeight
    scrollLength = Math.max(0, track.scrollWidth - viewport.clientWidth)

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY
    const viewportH = window.innerHeight
    triggerY = wrapperTop + pinHeight / 2 - viewportH / 2
    releaseY = triggerY + scrollLength

    wrapper.style.height = `${pinHeight + scrollLength}px`
  }

  function update() {
    if (!enabled) return
    const scrollY = window.scrollY

    if (scrollY < triggerY) {
      pin.style.position = 'absolute'
      pin.style.top = '0'
      pin.style.left = '0'
      pin.style.right = '0'
      pin.style.width = ''
      pin.style.transform = ''
      track.style.transform = 'translateX(0px)'
    } else if (scrollY <= releaseY) {
      const progress = scrollLength === 0 ? 0 : (scrollY - triggerY) / scrollLength
      pin.style.position = 'fixed'
      pin.style.top = '50%'
      pin.style.left = '0'
      pin.style.right = '0'
      pin.style.width = '100%'
      pin.style.transform = 'translateY(-50%)'
      track.style.transform = `translateX(${-progress * scrollLength}px)`
    } else {
      pin.style.position = 'absolute'
      pin.style.top = `${scrollLength}px`
      pin.style.left = '0'
      pin.style.right = '0'
      pin.style.width = ''
      pin.style.transform = ''
      track.style.transform = `translateX(${-scrollLength}px)`
    }
  }

  function onScroll() {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      update()
    })
  }

  function enable() {
    if (enabled) return
    enabled = true
    wrapper.style.position = 'relative'
    measure()
    update()
  }

  function disable() {
    if (!enabled) return
    enabled = false
    resetInlineStyles()
  }

  function handleResize() {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      if (isPC()) {
        enable()
        measure()
        update()
      } else {
        disable()
      }
    }, RESIZE_DEBOUNCE_MS)
  }

  // 초기 진입 시에는 디바운스 없이 즉시 판단
  if (isPC()) {
    enable()
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)

  return function destroy() {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
    window.clearTimeout(resizeTimer)
    if (rafId !== null) cancelAnimationFrame(rafId)
    disable()
  }
}
