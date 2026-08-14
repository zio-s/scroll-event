import { PC_MIN_WIDTH } from './breakpoint'

// Tablet/Mobile(overflow-x: auto)에서 마우스 클릭+드래그로도 카드 리스트를 스크롤
// 되게 한다. 터치는 브라우저가 알아서 처리하지만 클릭-드래그는 지원 안 해서 직접
// 구현, pointerType이 'mouse'일 때만 개입해 터치 동작은 안 건드린다.
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

  // 드래그 놓자마자 is-dragging을 떼면 scroll-snap이 바로 재적용돼 가장 가까운
  // 카드로 순간이동하며 튕겨 보인다. 대신 직접 scrollTo(smooth)로 스냅시키고,
  // 애니메이션이 끝나야 is-dragging을 뗀다.
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
