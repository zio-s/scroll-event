export interface DummySectionData {
  id: string
  eyebrow: string
  title: string
  body: string
  tone: 'light' | 'dark'
}

// 페이지 흐름 확인용 더미 콘텐츠. 개수/내용은 자유롭게 늘려도 됩니다.
export const dummySections: DummySectionData[] = [
  {
    id: 'dummy-intro',
    eyebrow: 'Intro',
    title: '이 페이지는 가로 스크롤 카드 섹션 과제 데모입니다',
    body: '아래로 스크롤하면 첫 번째 가로 스크롤 섹션(Vanilla JS 구현)이 나타납니다. 섹션에 진입하기 전까지는 평범한 세로 스크롤만 동작합니다.',
    tone: 'light',
  },
  {
    id: 'dummy-mid',
    eyebrow: 'Between',
    title: '두 가로 스크롤 섹션 사이의 더미 구간',
    body: '이 구간에서는 가로 스크롤이 발생하지 않고 일반적인 세로 스크롤만 동작해야 합니다. 계속 내리면 두 번째 가로 스크롤 섹션(GSAP ScrollTrigger 구현)으로 이어집니다.',
    tone: 'dark',
  },
  {
    id: 'dummy-outro',
    eyebrow: 'Outro',
    title: '페이지 끝 더미 섹션',
    body: '두 번째 가로 스크롤 섹션이 끝나면 다시 자연스러운 세로 스크롤 흐름으로 돌아와 이 섹션에 도달합니다.',
    tone: 'light',
  },
]
