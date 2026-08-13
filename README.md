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

## 코드 구조

```
src/
  data/
    cards.ts              가로 스크롤 섹션 데이터 (섹션 수, 카드 수 정의)
    dummy.ts               더미 섹션 데이터
  sections/
    breakpoint.ts            PC/Tablet·Mobile 기준값 (1025px) 하나로 공유
    dummySection.ts          더미 섹션 렌더링
    horizontalMarkup.ts      두 섹션이 공유하는 카드 섹션 DOM 마크업
    horizontalScrollVanilla.ts   섹션 A: 순수 JS로 만든 가로 스크롤 하이재킹
    horizontalScrollGSAP.ts      섹션 B: GSAP ScrollTrigger 버전
    dragScroll.ts            Tablet/Mobile에서 마우스 클릭+드래그 스크롤
    smoothScroll.ts          Lenis로 스크롤 입력 자체를 부드럽게 이징 처리
  styles/
    variables.css / reset.css / layout.css
    dummy-section.css
    horizontal-section.css   가로 스크롤 섹션 공통 스타일 + 반응형 오버라이드
  main.ts                    데이터 → DOM 조립, 스크롤 로직 초기화
```

마크업과 스타일은 두 섹션이 그대로 공유하고, 가로 스크롤을 실제로 굴리는 로직만 파일이 갈라져 있어서 코드 레벨에서 바로 비교가 됩니다.

## 핵심 인터랙션 구현 방식

트리거 조건("섹션 상단이 아니라 세로 중앙에 닿는 시점에 시작")을 맞추려고, `wheel` 이벤트를 가로채 `preventDefault` 하는 방식 대신 **스크롤 여유 공간 + position 전환**을 썼습니다.

1. 래퍼 섹션에 `pin 높이 + 카드가 이동해야 하는 거리`만큼 여유 공간을 만듭니다.
2. 그 구간을 지나는 동안 pin을 `fixed`로 화면 중앙에 고정하고, `scrollY` 변화량을 카드 트랙의 `translateX`로 옮겨 붓습니다.
3. 트리거 시점은 "래퍼 상단이 뷰포트에 닿을 때"가 아니라 "pin의 세로 중앙이 뷰포트 세로 중앙과 겹칠 때"로 계산합니다.

`wheel` 이벤트를 직접 안 건드리고 브라우저의 기본 스크롤을 그대로 흘려보내기 때문에, 트랙패드 관성 스크롤이나 키보드 스크롤을 따로 처리해줄 필요가 없습니다. `position: sticky` 대신 `fixed`/`absolute`를 쓴 것도 같은 맥락인데, 자세한 이유는 아래에 적었습니다.

- **섹션 A (`horizontalScrollVanilla.ts`)**: 위 로직을 `scroll`/`resize` 이벤트로 직접 구현. `triggerY`/`releaseY`를 계산해두고 `requestAnimationFrame`으로 스크롤 이벤트를 쓰로틀링합니다.
- **섹션 B (`horizontalScrollGSAP.ts`)**: GSAP ScrollTrigger의 `pin: true, start: "center center", scrub: true`가 위 로직을 그대로 제공합니다. `end`를 카드 이동 거리로 넘기고 `invalidateOnRefresh: true`를 켜면 리사이즈 재계산도 자동입니다.

### `position: sticky`를 쓰지 않은 이유

처음엔 sticky로 접근했는데, 결국 fixed/absolute 직접 전환으로 바꿨습니다. 이유가 두 가지입니다.

1. **sticky는 "세로 중앙 트리거"를 그대로 표현하기 어렵습니다.** sticky는 `top` 오프셋 기준으로 붙는데, "요소의 세로 중앙이 뷰포트 중앙과 만나는 시점"을 표현하려면 `top: calc(50vh - 요소높이/2)` 같은 계산이 필요하고, 요소 높이가 카드 수/반응형에 따라 바뀌는 이 케이스에서는 그 값을 매번 다시 계산해서 CSS 변수에 밀어넣어야 합니다 — 결국 JS가 필요한 건 똑같은데 sticky를 쓸 이유가 없어집니다.
2. **Safari sticky 버그를 저희 코드가 이미 건드리고 있었습니다.** `position: sticky`는 sticky 요소의 **조상** 중 하나라도 `overflow`가 `visible`이 아니면(예: `overflow: hidden`) 깨지는 걸로 잘 알려진 WebKit 버그가 있는데, 저희 `body`에 이미 `overflow-x: hidden`이 걸려 있습니다(카드 트랙이 잠깐 화면 밖으로 넘칠 때 페이지에 가로 스크롤바가 생기는 걸 막으려고 넣은 것). `body`는 pin 요소의 조상이니 sticky를 썼으면 정확히 이 버그를 밟았을 겁니다.

검색하면 `-webkit-sticky` 프리픽스를 붙이라는 글이 많이 나오는데, 그건 예전 Safari(대략 13 미만)가 `sticky`를 prefix 없이는 지원하지 않던 시절 얘기라 지금은 의미가 없습니다. 지금 최신 Safari가 겪는 sticky 문제는 지원 여부가 아니라 위에서 말한 "조상 overflow" 버그 쪽이고, prefix로 고쳐지는 종류가 아닙니다.

### 스크롤이 뚝뚝 끊기던 문제 (Lenis 도입)

처음 버전은 브라우저 네이티브 `scrollY`를 그대로 읽었는데, 마우스 휠처럼 "딸깍" 한 번에 큰 델타가 몰려서 들어오는 입력에서는 부드럽지 않았습니다. 원인을 확인하려고 참고 사이트(sindoh.com)가 실제로 쓰는 스크립트를 받아서 봤더니, GSAP ScrollTrigger 설정(`pin: true, scrub: true, invalidateOnRefresh: true`) 자체는 저희 섹션 B와 거의 같았고, 차이는 그 아래에 **Lenis**라는 스무스 스크롤 라이브러리를 깔아서 휠 입력을 이징 처리한 뒤 `window` 스크롤 위치 자체를 부드럽게 갱신해주고 있다는 점이었습니다.

같은 방식으로 `smoothScroll.ts`에 Lenis를 추가했습니다. Lenis가 실제 `window.scrollY`를 부드럽게 만들어주기 때문에, Vanilla/GSAP 두 구현 모두 로직을 바꿀 필요 없이 그 값을 그대로 읽기만 하면 됩니다. PC(1025px 이상)에서만 켜고 Tablet/Mobile에서는 꺼서 네이티브 터치 스크롤/스와이프를 그대로 둡니다.

여기에 더해, Vanilla 구현(`horizontalScrollVanilla.ts`)에는 별개의 문제도 있었습니다 — `before`/`after` 구간(섹션 근처에 가지도 않았을 때)에서도 스크롤할 때마다 `pin`의 position/top/left/width를 무조건 다시 쓰고 있어서 불필요한 style 재계산이 매 프레임 발생했습니다. 상태가 실제로 바뀔 때만 스타일을 쓰도록 고쳤습니다.

## 기술 선택 이유

- **Vite + TypeScript**: React 같은 프레임워크는 이 정도 스코프엔 과합니다. Vite는 개발 서버/빌드가 가볍고 GitHub Pages에 그대로 올리기 좋아서 골랐고, TS는 카드/섹션 데이터 타입을 잡아두면 데이터가 늘어나도 마크업 생성 코드가 안 깨지길 바라서 썼습니다. 빌드 결과물(`dist/`)은 결국 순수 HTML/CSS/JS라 "vanilla로 구현"이라는 요구사항과 어긋나지 않는다고 판단했습니다.
- **가로 스크롤 로직을 두 벌 만든 이유**: Vanilla 버전은 스크롤 수학(트리거/해제 시점, fixed/absolute 전환)을 직접 다룰 수 있다는 걸 보여주고, GSAP 버전은 실무에서 왜 이런 스크롤 연출에 ScrollTrigger를 자주 쓰는지(안정성, 리사이즈 자동 재계산, `matchMedia` 기반 반응형 분기)를 같이 보여주려고 넣었습니다. 실제로 하나만 골라야 한다면 유지보수 측면에서 GSAP 쪽을 썼을 것 같습니다.
- **반응형 대응**: 1024px 이하에서는 스크롤 하이재킹을 유지하지 않고 `overflow-x: auto` + `scroll-snap-type: x proximity` 기반 네이티브 가로 스와이프로 바꿨습니다. 터치로 하이재킹을 구현하려면 touch 이벤트를 따로 가로채야 해서 iOS Safari 등에서 스크롤이 끊기기 쉽고, 카드가 많아질수록 세로 리스트는 스크롤이 과도하게 길어져서 제외했습니다.

  마우스로 테스트하는 경우(브라우저 창을 좁혀서 보는 경우 등)를 위해 클릭+드래그 스크롤(`dragScroll.ts`)도 추가했습니다. 터치의 네이티브 스크롤에는 관여하지 않고 `pointerType === 'mouse'`일 때만 동작하며, 드래그를 놓으면 CSS `scroll-snap`에 그대로 맡기지 않고 가장 가까운 카드로 직접 `scrollTo({ behavior: 'smooth' })` 시킵니다 — 드래그 직후 바로 스냅에 맡기면 살짝만 움직이고 놓았을 때 브라우저가 순간적으로 튕기듯 되돌리는 게 눈에 띄어서, 자체적으로 부드럽게 정렬되도록 바꿨습니다.
- **카드 콘텐츠를 이모지 + 그라디언트로 채운 이유**: 외부 이미지에 기대면 네트워크 실패나 로딩 시점에 따른 레이아웃 시프트가 생길 수 있어서, CSS/이모지만으로 더미 콘텐츠를 구성했습니다.
- **Lenis(스무스 스크롤)**: "성능/부드러움" 요구사항을 만족시키려고 추가했습니다. 참고 사이트가 쓰는 조합을 그대로 가져온 것이라 별도 실험이 아니라 검증된 선택이라고 판단했습니다.

## 아쉬운 점 / 시간이 더 있었다면 하고 싶었던 것

- Lenis의 `lerp`/`wheelMultiplier` 값을 OS(Mac/Windows)별로 다르게 튜닝하는 건 참고 사이트가 하는 걸 확인했지만 시간 관계상 단일 값으로 남겨뒀습니다. Windows 마우스 휠은 델타가 더 커서 실제로는 OS별 보정이 있는 쪽이 더 자연스러울 수 있습니다.
- 카드로 포커스가 이동할 때(키보드 탭 이동) 가로 스크롤이 따라가는 접근성 처리는 시간 관계상 넣지 못했습니다.
- 두 섹션을 나란히 두다 보니 페이지가 좀 깁니다. 실제 프로덕션이었으면 하나만 남기고 나머지는 별도 데모 페이지로 뺐을 것 같습니다.

## 섹션 수 / 카드 수 추가하는 방법

- **카드 추가**: [src/data/cards.ts](src/data/cards.ts)의 `horizontalSections` 배열에서 각 섹션의 `cards` 배열 길이만 늘리면 됩니다(`buildCards('a', 9)`의 숫자를 바꾸거나 `CardData` 객체를 직접 추가). 카드 레이아웃이 `flex: 0 0 clamp(...)` 기반이라 개수가 늘어나도 깨지지 않고, 늘어난 만큼 스크롤 거리만 자동으로 늘어납니다(Vanilla/GSAP 둘 다 매 순간 `track.scrollWidth`를 다시 잽니다).
- **섹션 추가**: `horizontalSections` 배열에 새 `HorizontalSectionData` 객체를 추가하고, [src/main.ts](src/main.ts)에서 `buildHorizontalSection` → `init...HorizontalScroll` 호출을 한 세트 더 붙이면 됩니다(Vanilla/GSAP 중 어떤 방식을 쓸지는 자유입니다).
- **더미 섹션 추가**: [src/data/dummy.ts](src/data/dummy.ts)의 `dummySections` 배열에 항목을 추가하고 `main.ts`에서 원하는 위치에 `renderDummySection(...)`을 호출하면 됩니다.
