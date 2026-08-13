import { PC_MIN_WIDTH } from './breakpoint'

/**
 * Tablet/Mobile(overflow-x: auto) 구간에서 마우스 클릭 + 드래그로도 카드 리스트를
 * 스크롤할 수 있게 해준다.
 *
 * 터치는 브라우저가 기본으로 네이티브 스크롤을 처리해주지만, 마우스 클릭-드래그는
 * 스크롤바를 직접 끌지 않는 이상 브라우저가 지원하지 않는 동작이라 별도로 구현했다.
 * pointerType이 'mouse'일 때만 개입해서 터치의 네이티브 스크롤/스와이프 동작은
 * 건드리지 않는다.
 */
export function enableDragToScroll(viewport: HTMLElement): () => void {
  let dragging = false
  let startX = 0
  let startScrollLeft = 0

  const isPC = () => window.innerWidth >= PC_MIN_WIDTH

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || isPC()) return
    dragging = true
    startX = e.clientX
    startScrollLeft = viewport.scrollLeft
    viewport.classList.add('is-dragging')
    viewport.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    viewport.scrollLeft = startScrollLeft - (e.clientX - startX)
  }

  function endDrag(e: PointerEvent) {
    if (!dragging) return
    dragging = false
    viewport.classList.remove('is-dragging')
    if (viewport.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId)
    }
  }

  viewport.addEventListener('pointerdown', onPointerDown)
  viewport.addEventListener('pointermove', onPointerMove)
  viewport.addEventListener('pointerup', endDrag)
  viewport.addEventListener('pointercancel', endDrag)

  return function destroy() {
    viewport.removeEventListener('pointerdown', onPointerDown)
    viewport.removeEventListener('pointermove', onPointerMove)
    viewport.removeEventListener('pointerup', endDrag)
    viewport.removeEventListener('pointercancel', endDrag)
  }
}
