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
    body: '아래로 스크롤하면 가로 스크롤 섹션이 나타납니다. 섹션에 진입하기 전까지는 평범한 세로 스크롤만 동작합니다. 가로 스크롤 섹션 안에서는 여러 개의 하위 섹션(카드 그룹)이 끊김 없이 이어집니다.',
    tone: 'light',
  },
  {
    id: 'dummy-outro',
    eyebrow: 'Outro',
    title: '페이지 끝 더미 섹션',
    body: '가로 스크롤 섹션의 마지막 그룹까지 지나면 고정이 풀리고, 다시 자연스러운 세로 스크롤 흐름으로 돌아와 이 섹션에 도달합니다.',
    tone: 'dark',
  },
]
