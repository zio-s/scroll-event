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

  // 드래그를 놓자마자 is-dragging을 떼면 scroll-snap이 즉시 재적용되면서 브라우저가
  // "가장 가까운 카드"로 순간 이동시켜버려 튕기는 것처럼 보인다(터치는 OS 관성 스크롤이
  // 스냅까지 한 번에 처리해서 이 문제가 없다). 그래서 CSS 스냅에 맡기지 않고, 가장 가까운
  // 카드로 직접 부드럽게 scrollTo 시킨 뒤 애니메이션이 끝나야 is-dragging을 뗀다.
  function snapToNearestCard() {
    const cards = Array.from(viewport.querySelectorAll<HTMLElement>('.h-card'))
    if (cards.length === 0) {
      viewport.classList.remove('is-dragging')
      return
    }

    const current = viewport.scrollLeft
    let nearest = cards[0]
    let nearestDist = Infinity
    for (const card of cards) {
      const dist = Math.abs(card.offsetLeft - current)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = card
      }
    }

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      viewport.classList.remove('is-dragging')
      viewport.removeEventListener('scrollend', finish)
    }
    viewport.addEventListener('scrollend', finish)
    window.setTimeout(finish, 500) // scrollend 미지원 브라우저 대비 폴백

    viewport.scrollTo({ left: nearest.offsetLeft, behavior: 'smooth' })
  }

  function endDrag(e: PointerEvent) {
    if (!dragging) return
    dragging = false
    if (viewport.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId)
    }
    snapToNearestCard()
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
