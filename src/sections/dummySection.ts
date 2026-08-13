import type { DummySectionData } from '../data/dummy'

export function renderDummySection(data: DummySectionData): HTMLElement {
  const section = document.createElement('section')
  section.className = `dummy-section${data.tone === 'dark' ? ' dummy-section--dark' : ''}`
  section.id = data.id

  section.innerHTML = `
    <div class="container">
      <span class="dummy-section__eyebrow">${data.eyebrow}</span>
      <h2 class="dummy-section__title">${data.title}</h2>
      <p class="dummy-section__body">${data.body}</p>
    </div>
  `

  return section
}
