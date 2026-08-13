import type { HorizontalSectionRefs } from './horizontalMarkup'
import { PC_MIN_WIDTH } from './breakpoint'

const RESIZE_DEBOUNCE_MS = 150

// wheel/touch에 preventDefault를 거는 대신, 문서에 스크롤 여유 공간(wrapper 높이 =
// pin 높이 + 카드 이동 거리)을 만들어두고 그 구간을 지나는 동안 pin을 fixed로 고정한 채
// scrollY 변화량을 카드 트랙의 translateX로 옮겨 붓는 방식. 네이티브 스크롤 이벤트만
// 보기 때문에 휠이든 트랙패드든 따로 분기할 필요가 없다.
//
// before(위) / pinned(고정) / after(아래) 세 구간으로 나눠서 pin의 position을
// absolute → fixed → absolute로 바꾼다. triggerY는 "wrapper 상단이 뷰포트에 닿는 시점"이
// 아니라 "pin 세로 중앙 = 뷰포트 세로 중앙"이 되는 시점으로 계산한다 (요구사항 1-2).
export function initVanillaHorizontalScroll(refs: HorizontalSectionRefs): () => void {
  const { wrapper, pin, viewport, track } = refs

  let enabled = false
  let scrollLength = 0
  let triggerY = 0
  let releaseY = 0
  let rafId: number | null = null
  let resizeTimer: number | undefined
  let currentState: 'before' | 'pinned' | 'after' | null = null

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

    // measure()가 pin을 static으로 되돌려놨으므로, 버킷이 그대로라도 다음 update()가
    // 실제 스타일을 다시 적용하도록 강제한다.
    currentState = null
  }

  // pin의 position/top/left/width는 before → pinned → after 세 구간을 오가며 "상태가
  // 바뀔 때"만 새로 쓴다. 프레임마다 값이 같은데도 무조건 다시 쓰면(특히 before 구간,
  // 즉 섹션 근처에 가지도 않았을 때조차) 매 스크롤 프레임마다 불필요한 style 재계산이
  // 걸려서 휠 스크롤처럼 짧은 시간에 이벤트가 몰릴 때 프레임이 튄다.
  function update() {
    if (!enabled) return
    const scrollY = window.scrollY

    if (scrollY < triggerY) {
      if (currentState !== 'before') {
        pin.style.position = 'absolute'
        pin.style.top = '0'
        pin.style.left = '0'
        pin.style.right = '0'
        pin.style.width = ''
        pin.style.transform = ''
        track.style.transform = 'translateX(0px)'
        currentState = 'before'
      }
    } else if (scrollY <= releaseY) {
      if (currentState !== 'pinned') {
        pin.style.position = 'fixed'
        pin.style.top = '50%'
        pin.style.left = '0'
        pin.style.right = '0'
        pin.style.width = '100%'
        pin.style.transform = 'translateY(-50%)'
        currentState = 'pinned'
      }
      // translateX만 진행률에 따라 매 프레임 바뀌어야 하는 유일한 값이다.
      const progress = scrollLength === 0 ? 0 : (scrollY - triggerY) / scrollLength
      track.style.transform = `translateX(${-progress * scrollLength}px)`
    } else {
      if (currentState !== 'after') {
        pin.style.position = 'absolute'
        pin.style.top = `${scrollLength}px`
        pin.style.left = '0'
        pin.style.right = '0'
        pin.style.width = ''
        pin.style.transform = ''
        track.style.transform = `translateX(${-scrollLength}px)`
        currentState = 'after'
      }
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
    // 모바일(overflow-x: auto)에서 스와이프한 잔여 scrollLeft가 남아있으면 PC 모드의
    // translateX와 겹쳐서 카드 위치가 이중으로 밀린다. Safari는 overflow가 hidden으로
    // 바뀐 뒤에도 이 값을 Chrome보다 잘 보존해서 증상이 더 잘 드러난다.
    viewport.scrollLeft = 0
    measure()
    update()
  }

  function disable() {
    if (!enabled) return
    enabled = false
    resetInlineStyles()
    viewport.scrollLeft = 0
    currentState = null
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
