# 가로 스크롤 카드 섹션

헬로디지털 프론트엔드 코딩 과제 — PC에서 마우스 휠(세로 스크롤)을 카드 리스트의 가로 스크롤로 변환하고, 섹션 타이틀은 스크롤 도중에도 고정된 채 유지되는 UI를 구현했습니다.

- 배포 링크: https://zio-s.github.io/scroll-event/

## 실행 방법

```bash
yarn
yarn dev       # 개발 서버
yarn build     # 프로덕션 빌드 (dist/)
yarn preview   # 빌드 결과 로컬 미리보기
```

## 페이지 구성

```
[더미 섹션: Intro]
[가로 스크롤 섹션 A — Vanilla JS 구현]
[더미 섹션: Between]
[가로 스크롤 섹션 B — GSAP ScrollTrigger 구현]
[더미 섹션: Outro]
```

동일한 인터랙션을 **두 가지 방식으로 각각 구현**했습니다. 하나만 제출하는 것보다, 두 구현을 나란히 비교하는 편이 "왜 이 방식을 선택했는지"를 더 명확하게 보여줄 수 있다고 판단했습니다.

## 코드 구조

```
src/
  data/
    cards.ts              가로 스크롤 섹션 데이터 (섹션 수, 카드 수 정의)
    dummy.ts               더미 섹션 데이터
  sections/
    dummySection.ts         더미 섹션 렌더링
    horizontalMarkup.ts      두 엔진이 공유하는 카드 섹션 DOM 마크업 생성
    horizontalScrollVanilla.ts   섹션 A: 순수 JS 스크롤 하이재킹 엔진
    horizontalScrollGSAP.ts      섹션 B: GSAP ScrollTrigger 엔진
  styles/
    variables.css / reset.css / layout.css
    dummy-section.css
    horizontal-section.css   가로 스크롤 섹션 공통 스타일 + 반응형 오버라이드
  main.ts                    데이터 → DOM 조립, 엔진 초기화
```

마크업(`horizontalMarkup.ts`)과 스타일은 두 섹션이 공유하고, **가로 스크롤을 제어하는 엔진 로직만 분리**되어 있어 두 구현을 코드 레벨에서 바로 비교할 수 있습니다.

## 핵심 인터랙션 구현 방식

과제의 트리거 조건("섹션 상단이 아니라 세로 중앙에 닿는 시점에 시작")을 만족시키기 위해, `wheel` 이벤트를 가로채서 `preventDefault` 하는 방식 대신 **스크롤 여유 공간 + position 전환** 방식을 사용했습니다.

1. 래퍼 섹션에 `pin 높이 + 카드가 이동해야 하는 거리`만큼 스크롤 여유 공간을 확보합니다.
2. 그 구간을 지나는 동안 pin 요소를 `fixed`로 화면 중앙에 고정하고, `scrollY` 변화량을 카드 트랙의 `translateX`로 매핑합니다.
3. 트리거 시점은 "래퍼 상단이 뷰포트에 닿을 때"가 아니라 "pin의 세로 중앙이 뷰포트 세로 중앙과 일치할 때"로 계산합니다.

이 방식은 브라우저의 네이티브 스크롤을 그대로 사용하므로 트랙패드 관성 스크롤, 일반 휠, 키보드 스크롤이 별도 처리 없이 자연스럽게 동작하고, `position: sticky` 대신 `position: fixed`를 사용해 Safari의 `sticky + overflow` 렌더링 이슈를 원천적으로 피합니다.

- **섹션 A (`horizontalScrollVanilla.ts`)**: 위 로직을 `scroll`/`resize` 이벤트로 직접 구현. `triggerY`/`releaseY`를 수식으로 계산하고 `requestAnimationFrame`으로 스크롤 이벤트를 쓰로틀링합니다.
- **섹션 B (`horizontalScrollGSAP.ts`)**: GSAP ScrollTrigger의 `pin: true, start: "center center", scrub: true` 옵션이 위 로직을 그대로 지원합니다. `end`를 카드 이동 거리로 지정하고 `invalidateOnRefresh: true`를 켜면 리사이즈 재계산도 자동으로 처리됩니다.

## 기술 선택 이유

- **번들러: Vite + TypeScript** — 별도 프레임워크 없이 DOM을 직접 다루는 과제 특성상 React 등은 오버엔지니어링이라 판단했습니다. Vite는 빠른 dev 서버와 간단한 정적 빌드로 GitHub Pages 배포에 적합했고, TypeScript는 카드/섹션 데이터 타입을 명시해 데이터가 늘어나도 마크업 생성 코드가 안전하게 동작하도록 하기 위해 선택했습니다.
- **가로 스크롤 로직을 두 가지로 구현한 이유**: 순수 JS 구현은 스크롤 수학(트리거/해제 시점, fixed/absolute 전환)을 직접 다룰 수 있음을 보여주고, GSAP 구현은 실무에서 이런 스크롤 연출에 GSAP ScrollTrigger가 왜 자주 쓰이는지(안정성, 리사이즈 자동 재계산, `matchMedia` 기반 반응형 분기)를 함께 보여주기 위함입니다. 실제 프로젝트라면 유지보수성과 안정성을 고려해 GSAP 쪽을 채택했을 것 같습니다.
- **`position: sticky`를 쓰지 않은 이유**: 요구사항에 명시된 대로 Safari에서 `sticky + overflow` 조합이 렌더링 이슈를 일으키는 경우가 있어, 처음부터 JS로 `fixed`/`absolute` 상태를 직접 전환하는 방식을 택해 이 문제 자체를 피했습니다.
- **반응형(Tablet/Mobile) 대응 방식**: 1024px 이하에서는 PC의 스크롤 하이재킹을 그대로 유지하지 않고, `overflow-x: auto` + `scroll-snap-type: x proximity` 기반 **네이티브 가로 스와이프**로 전환했습니다. 터치 환경에서 스크롤 하이재킹을 구현하려면 터치 이벤트를 별도로 가로채야 하는데, 이는 iOS Safari 등에서 스크롤이 끊기거나 막히는 문제를 일으키기 쉽고, 애초에 모바일에서는 가로 스와이프가 훨씬 자연스러운 인터랙션이라고 판단했습니다. 데스크톱 로직(`initVanillaHorizontalScroll`, `initGsapHorizontalScroll`)은 `matchMedia`/뷰포트 폭 체크로 PC(1025px 이상)에서만 활성화되고, 그 외에는 CSS만으로 폴백됩니다.
- **카드 콘텐츠를 이모지 + 그라디언트 배경으로 채운 이유**: 외부 이미지 CDN에 대한 의존(네트워크 실패, CORS, 로딩 시점에 따른 레이아웃 시프트)을 없애기 위해 순수 CSS/이모지로 더미 콘텐츠를 구성했습니다.

## 아쉬운 점 / 시간이 더 있었다면 하고 싶었던 것

- 실제 트랙패드/휠 입력에 대한 다양한 브라우저(특히 Safari, Firefox)에서의 관성 스크롤 체감을 더 세밀하게 튜닝하고 싶었습니다. 현재는 두 엔진 모두 즉시 반응(scrub 없이 1:1 매핑)하도록 맞췄는데, GSAP 쪽은 `scrub` 값을 조절해 약간의 관성감을 주는 것도 고려해볼 만합니다.
- 카드에 포커스 이동 시(키보드 탭 이동) 가로 스크롤이 자동으로 따라가는 접근성(a11y) 처리는 시간 관계상 넣지 못했습니다.
- 두 섹션을 나란히 두다 보니 페이지가 다소 긴데, 실제 프로덕션이라면 두 구현 중 하나만 유지하고 나머지는 스토리북/데모 페이지로 분리했을 것 같습니다.
- 자동화된 크로스 브라우저 테스트(Playwright 등)를 붙여서 리사이즈/브레이크포인트 전환 시나리오를 회귀 테스트로 남기고 싶었으나, 과제 범위상 수동 확인으로 대체했습니다.

## 섹션 수 / 카드 수 추가하는 방법

- **카드 추가**: [src/data/cards.ts](src/data/cards.ts)의 `horizontalSections` 배열에서 각 섹션의 `cards` 배열 길이만 늘리면 됩니다(`buildCards('a', 9)`의 숫자를 바꾸거나 `CardData` 객체를 직접 추가). 카드 레이아웃은 `flex: 0 0 clamp(...)` 기반이라 개수가 늘어나도 깨지지 않고, 늘어난 만큼 스크롤 거리만 자동으로 늘어납니다(두 엔진 모두 `track.scrollWidth`를 매 순간 다시 측정합니다).
- **섹션 추가**: `horizontalSections` 배열 자체에 새 `HorizontalSectionData` 객체를 추가하고, [src/main.ts](src/main.ts)에서 `buildHorizontalSection` → `init...HorizontalScroll` 호출을 한 세트 더 추가하면 됩니다(어떤 엔진을 쓸지는 자유롭게 선택 가능).
- **더미 섹션 추가**: [src/data/dummy.ts](src/data/dummy.ts)의 `dummySections` 배열에 항목을 추가하고 `main.ts`에서 원하는 위치에 `renderDummySection(...)`을 호출하면 됩니다.
