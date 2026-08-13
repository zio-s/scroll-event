import type { HorizontalSectionData } from '../data/cards'

export interface HorizontalSectionRefs {
  wrapper: HTMLElement
  pin: HTMLElement
  viewport: HTMLElement
  track: HTMLElement
}

export function buildHorizontalSection(data: HorizontalSectionData): HorizontalSectionRefs {
  const wrapper = document.createElement('section')
  wrapper.className = 'h-scroll-wrapper'
  wrapper.id = data.id

  const pin = document.createElement('div')
  pin.className = 'h-scroll-pin'

  const header = document.createElement('div')
  header.className = 'h-scroll-header container'
  header.innerHTML = `
    <span class="h-scroll-badge">${data.eyebrow}</span>
    <h2 class="h-scroll-title">${data.title}</h2>
    <p class="h-scroll-desc">${data.description}</p>
  `

  const viewport = document.createElement('div')
  viewport.className = 'h-scroll-viewport container'

  const track = document.createElement('ul')
  track.className = 'h-scroll-track'
  track.innerHTML = data.cards
    .map(
      (card) => `
      <li class="h-card">
        <div class="h-card__media" style="background: linear-gradient(155deg, ${card.colorFrom}, ${card.colorTo})">
          <span aria-hidden="true">${card.emoji}</span>
        </div>
        <p class="h-card__eyebrow">${card.eyebrow}</p>
        <h3 class="h-card__title">${card.title}</h3>
      </li>
    `,
    )
    .join('')

  viewport.appendChild(track)
  pin.append(header, viewport)
  wrapper.appendChild(pin)

  return { wrapper, pin, viewport, track }
}
