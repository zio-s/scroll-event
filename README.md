# 가로 스크롤 카드 섹션

헬로디지털 프론트엔드 코딩 과제 — PC에서 마우스 휠(세로 스크롤)을 카드 리스트의 가로 스크롤로 변환하고, 섹션 타이틀은 스크롤 도중에도 고정된 채 유지되는 UI를 구현했습니다.

- 배포 링크: https://zio-s.github.io/scroll-event/

> 1차 제출 피드백을 반영해 구조를 다시 잡았습니다. 처음엔 "독립된 가로 스크롤 하이재킹 두 개"로 이해했는데, 정확히는 **하나의 하이재킹 안에서 여러 섹션(카드 그룹)이 끊김 없이 이어지는 구조**([섹션1 카드들] → [섹션2 카드들] → ...)였습니다. 이에 맞춰 데이터/마크업/스크롤 로직을 다시 짰고, 구현도 Vanilla/GSAP 두 벌 대신 **GSAP ScrollTrigger 하나에 집중**했습니다.

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
[가로 스크롤 하이재킹 시작]
  섹션 1(산업별 도입 사례, 카드 5장) → 섹션 2(고객사 도입 사례, 카드 4장) → 섹션 3(기업 소식, 카드 6장)
  — 하이재킹이 풀리지 않고 이어서 흐름
[가로 스크롤 하이재킹 끝]
[더미 섹션: Outro]
```

섹션 타이틀은 별도로 "떠 있는" 공용 요소가 아니라 **각 섹션에 딸린 콘텐츠**입니다. 다만 카드와 똑같은 속도로 흘러가지는 않고, 자기 섹션이 지나가는 동안은 좌측 padding 라인에 고정되어 있다가 섹션이 끝날 때만 카드처럼 화면 밖으로 밀려나면서 다음 섹션의 타이틀이 그 자리를 이어받습니다.

## 코드 구조

```
src/
  data/
    cards.ts                 scrollGroups 배열 — 섹션 수, 섹션별 카드 수 정의
    dummy.ts                  더미 섹션 데이터
  pageSections.ts             페이지 순서: [더미] → [가로 스크롤] → [더미]
  sections/
    breakpoint.ts              PC/Tablet·Mobile 기준값(1025px) 공유
    dummySection.ts            더미 섹션 렌더링
    groupedScrollMarkup.ts     섹션들이 이어지는 가로 스크롤 DOM 마크업
    groupedScrollGSAP.ts       GSAP ScrollTrigger pin + scrub 엔진
    dragScroll.ts              Tablet/Mobile에서 섹션별 마우스 클릭+드래그 스크롤
    smoothScroll.ts            Lenis로 스크롤 입력을 부드럽게 이징 처리
  styles/
    variables.css / reset.css / layout.css
    dummy-section.css
    horizontal-section.css    가로 스크롤 섹션 스타일 + 반응형 오버라이드
  main.ts                     pageSections를 순회하며 DOM 조립 + 스크롤 로직 초기화
```

## 핵심 인터랙션 구현 방식

트리거 조건("섹션 상단이 아니라 세로 중앙에 닿는 시점에 시작")을 맞추려고, `wheel` 이벤트를 가로채 `preventDefault` 하는 방식 대신 GSAP ScrollTrigger의 **pin + scrub**을 씁니다.

1. `.h-scroll-track`에 모든 섹션의 카드를 순서대로 이어붙입니다(섹션1 카드들 → 섹션2 카드들 → ...). 섹션 경계에서 특별히 끊기는 처리를 하지 않기 때문에, 트랙 하나를 `translateX`로 미는 것만으로 여러 섹션이 이어지는 효과가 자연스럽게 나옵니다.
2. 트리거 시점은 `start: () => \`top+=${centerOffset} center\`` — "래퍼 상단이 뷰포트에 닿을 때"가 아니라 "첫 번째 섹션 카드 로우의 세로 중앙이 뷰포트 세로 중앙과 겹칠 때"로 계산합니다. `centerOffset`은 pin 상단부터 카드 로우 중앙까지의 실측 거리라서, 타이틀 높이 때문에 카드가 화면 중앙보다 아래로 밀리지 않습니다.
3. `end: () => \`+=${getScrollLength()}\`` 로 카드가 이동해야 하는 총 거리만큼 스크롤 여유를 주고, `invalidateOnRefresh: true`로 리사이즈 시 자동 재계산되게 합니다.

### 타이틀이 "고정되어 있다가 섹션이 끝나면 밀려나가는" 방식 (카운터 스크롤)

타이틀은 각 섹션 안에 있는 콘텐츠라 트랙과 함께 `-scrollX`만큼 움직이는 게 기본값인데, 그러면 섹션이 시작하자마자 타이틀도 바로 화면 밖으로 사라져버립니다(요구사항 3-1과 어긋남). 그래서 매 프레임 각 섹션의 헤더에 트랙과 반대 방향으로 보정값을 더해 두 움직임을 상쇄시킵니다.

```
paddingX     = 트랙의 시작 padding 위치 (타이틀이 "고정"되어야 할 목표 지점)
entryOffset  = 이 섹션이 자연 상태로 놓인 위치 - paddingX   // 고정 지점에 도착하는 데 필요한 scrollX
localX       = scrollX - entryOffset
보정값        = clamp(localX, 0, 섹션 폭 - 헤더 폭)          // headerMaxShift
header.style.transform = translateX(보정값)
```

처음엔 `entryOffset` 없이 `localX = scrollX - 섹션 시작 위치`로만 계산했는데, 그러면 최종 위치가 `섹션 시작 위치 - scrollX + 보정값`으로 정리되면서 `섹션 시작 위치` 항이 통째로 상쇄되어 **항상 화면 맨 왼쪽 끝(0)에 고정**되는 버그가 있었습니다(padding 값 자체가 식에서 빠져 있었음). `paddingX`를 기준점으로 넣어서 목표 지점을 "0"이 아니라 "padding 라인"으로 바로잡았습니다.

- 섹션이 시작되기 전(`localX < 0`)에는 보정값이 0으로 묶여서, 헤더가 화면 오른쪽에서 자연스럽게 들어옵니다.
- 섹션이 진행되는 동안은 보정값이 `scrollX` 증가분을 그대로 따라가면서 트랙의 이동을 정확히 상쇄시켜, 화면상으로는 타이틀이 좌측 padding 라인에 멈춰 있는 것처럼 보입니다.
- 보정값이 한도(`headerMaxShift`, 대략 "섹션 폭 − 헤더 폭")를 넘어서면(=섹션이 거의 다 지나가면) 더 이상 상쇄가 안 되니, 그때부터는 헤더도 카드처럼 화면 밖으로 밀려납니다.

`headerMaxShift` 계산에서 주의할 점 하나: `.h-scroll-section`이 `flex-direction: column`이라 기본 `align-items: stretch` 때문에 헤더가 섹션 전체 폭(=카드 로우 폭)까지 늘어나 버리면 `헤더 폭`이 항상 `섹션 폭`과 같아져서 `headerMaxShift`가 0이 되고, 보정 자체가 먹히지 않습니다. `.h-scroll-section-header { align-self: flex-start }`로 이 stretch를 꺼서 헤더가 자기 콘텐츠 폭만큼만 차지하도록 해야 합니다.

### `position: sticky`를 쓰지 않은 이유

1. **sticky는 "세로 중앙 트리거"를 그대로 표현하기 어렵습니다.** sticky는 `top` 오프셋 기준으로 붙는데, "요소의 세로 중앙이 뷰포트 중앙과 만나는 시점"을 표현하려면 `top: calc(50vh - 요소높이/2)` 같은 계산이 필요하고, 요소 높이가 섹션 구성에 따라 바뀌는 이 케이스에서는 그 값을 매번 다시 계산해야 합니다.
2. **Safari sticky 버그를 저희 코드가 이미 건드리고 있었습니다.** `position: sticky`는 sticky 요소의 **조상** 중 하나라도 `overflow`가 `visible`이 아니면 깨지는 걸로 잘 알려진 WebKit 버그가 있는데, 저희 `body`에 이미 `overflow-x: hidden`이 걸려 있습니다(카드 트랙이 잠깐 화면 밖으로 넘칠 때 페이지에 가로 스크롤바가 생기는 걸 막으려고 넣은 것). `body`는 pin 요소의 조상이니 sticky를 썼으면 정확히 이 버그를 밟았을 겁니다.

검색하면 `-webkit-sticky` 프리픽스를 붙이라는 글이 많이 나오는데, 그건 예전 Safari(대략 13 미만)가 `sticky`를 prefix 없이는 지원하지 않던 시절 얘기라 지금은 의미가 없습니다. GSAP ScrollTrigger의 `pin`도 내부적으로 `fixed`를 사용해서 같은 문제를 피합니다.

### 스크롤이 뚝뚝 끊기던 문제 (Lenis 도입)

브라우저 네이티브 `scrollY`를 그대로 읽으면, 마우스 휠처럼 "딸깍" 한 번에 큰 델타가 몰려서 들어오는 입력에서는 부드럽지 않습니다. 참고 사이트(sindoh.com)가 실제로 쓰는 스크립트를 받아서 확인해보니, GSAP ScrollTrigger 설정(`pin: true, scrub: true, invalidateOnRefresh: true`) 자체는 저희와 거의 같았고, 차이는 그 아래에 **Lenis**라는 스무스 스크롤 라이브러리를 깔아서 휠 입력을 이징 처리한 뒤 `window` 스크롤 위치 자체를 부드럽게 갱신해주고 있다는 점이었습니다.

같은 방식으로 `smoothScroll.ts`에 Lenis를 추가했습니다. Lenis가 실제 `window.scrollY`를 부드럽게 만들어주기 때문에 GSAP 엔진은 로직을 바꿀 필요 없이 그 값을 그대로 읽기만 하면 됩니다. PC(1025px 이상)에서만 켜고 Tablet/Mobile에서는 꺼서 네이티브 터치 스크롤/스와이프를 그대로 둡니다.

### 섹션 폭이 Chrome/Safari에서 다르게 계산되던 문제

`.h-scroll-section`이 `flex-direction: column` 안에 텍스트(헤더)와 고정폭 카드 로우를 같이 담고 있으면, 이 박스의 "내용에 맞춰 줄어드는 폭(shrink-to-fit)"을 브라우저마다 다르게 계산합니다. 그래서 카드 로우의 실제 렌더링 폭을 재서 섹션 박스 폭에 그대로 못박는(`el.style.width = ...`) 방식으로 이 계산 자체를 브라우저에 맡기지 않도록 했는데, 그 "재는 방법"을 두 번 고쳤습니다.

1. 처음엔 `cardsEl.scrollWidth`로 쟀습니다 — 정수로 반올림되는 값이라 카드가 많아질수록 Safari에서 반올림 오차가 쌓여 섹션 사이에 의도치 않은 간격이 생겼습니다.
2. 소수점까지 정확한 `cardsEl.getBoundingClientRect().width`로 바꿨는데, 이건 **매 리사이즈마다 우리가 직접 이 값을 `el.style.width`로 못박았다 지웠다 하는 대상을 다시 재는 구조**라, Safari에서는 `style.width = ''`로 지운 직후 같은 틱에 재측정해도 이전에 못박은 값이 완전히 반영 해제되지 않은 채로 읽혀서, 리프레시(리사이즈 등)를 거듭할수록 섹션 폭이 점점 부풀려지는 문제가 있었습니다.
3. 최종적으로는 컨테이너 자신이 아니라 **그 안의 개별 `.h-card`들 — 첫 카드의 왼쪽 끝부터 마지막 카드의 오른쪽 끝까지**를 직접 재는 방식으로 바꿨습니다. 카드 엘리먼트 자체는 저희 JS가 폭을 건드린 적이 없어서, 이전에 강제한 값이 남아있을 여지 자체가 없습니다.

리사이즈 시에도 어긋나지 않도록 `ScrollTrigger`의 `onRefreshInit`마다 다시 재고 다시 고정합니다.

### 스크롤 종료 지점이 Chrome/Safari에서 다르게 끝나던 문제

카드가 다 지나갔는데도 Safari에서만 스크롤이 좀 더 남아있는(빈 공간이 스크롤되는) 문제가 있었습니다. 원인은 총 스크롤 거리(`getScrollLength`)를 `track.scrollWidth - viewport.clientWidth`로 계산했던 부분으로, 위와 같은 정수 반올림 오차가 카드 15장 + 섹션 간 간격을 거치며 브라우저마다 다르게 누적된 것이었습니다.

`getBoundingClientRect()` 기반으로 바꾸되, 트랙 자신의 폭을 재는 방식은 쓸 수 없었습니다 — `.h-scroll-track`은 `display: flex`인 block 레벨 요소라, 자식이 아무리 넘쳐도(overflow) 박스 자체의 폭은 부모(`.h-scroll-viewport`)의 폭을 그대로 채워버리기 때문입니다(`width: auto`의 기본 동작). 대신 **"마지막 카드의 오른쪽 끝 − 트랙의 왼쪽 끝"**으로 총 콘텐츠 폭을 계산합니다. 이 둘은 항상 같은 `translateX` 아래 있어서, 현재 스크롤이 어디까지 진행됐든(트랙에 어떤 transform이 걸려 있든) 그 차이는 항상 똑같습니다 — 그러면서도 `getBoundingClientRect()` 기반이라 정수 반올림 없이 정확합니다.

### 섹션 사이 간격(gap)

섹션(카드 그룹) 사이 간격은 카드 한 장 사이 간격(20px)보다 훨씬 크게(`302px`) 뒀습니다. 간격이 좁으면 뷰포트가 넓을 때 이전 섹션의 마지막 카드와 다음 섹션의 첫 카드/타이틀이 화면에 동시에 걸쳐 보여서 경계가 지저분해 보이기 때문입니다. 타이틀이 좌측 padding 라인에 도착하는 시점(`entryOffset`)에는 이전 섹션이 이미 화면 밖으로 완전히 빠져나가 있도록, 실측값으로 맞춘 값입니다.

### 카드가 padding 안쪽 여백으로 사라지던 문제

처음엔 `.h-scroll-viewport`에 `.container`(최대 1400px + padding) 클래스를 그대로 붙였는데, 그러면 카드가 잘리는 경계(클리핑 경계) 자체가 padding 안쪽에 생겨서 좌우에 흰 여백이 보이고 카드가 그 여백 속으로 사라지는 것처럼 보였습니다. 뷰포트는 화면 끝까지 꽉 차야 하고, padding은 "시작 위치"에만 적용되어야 합니다 — `.h-scroll-viewport`에서 `.container`를 떼고, 대신 `.h-scroll-track`에 `padding-inline: max(var(--container-pad), calc((100% - var(--container-max)) / 2))`를 줘서 첫 카드/타이틀의 시작 위치만 기존 레이아웃 규칙(최대 1400px + padding)을 따르고, 스크롤 중에는 화면 가장자리까지 꽉 찬 채로 카드가 지나가도록 고쳤습니다.

## 기술 선택 이유

- **GSAP ScrollTrigger 하나로 집중한 이유**: 처음엔 Vanilla/GSAP 두 벌을 만들어서 비교하는 방향으로 갔었는데, 구조를 다시 잡으면서(하나의 pin 안에 여러 섹션이 이어지는 방식) 스크롤 진행률 계산이 한층 복잡해졌습니다. 이 복잡도를 직접 구현으로 감당하는 것보다, `pin`/`scrub`/`invalidateOnRefresh`처럼 이미 검증된 GSAP의 기능 위에서 정확성에 집중하는 편이 이번 재작업의 우선순위(정확한 구조로 확실하게 만드는 것)에 더 맞다고 판단했습니다.
- **Vite + TypeScript**: React 같은 프레임워크는 이 정도 스코프엔 과합니다. Vite는 개발 서버/빌드가 가볍고 GitHub Pages에 그대로 올리기 좋아서 골랐고, TS는 섹션/카드 데이터 타입을 잡아두면 데이터가 늘어나도 마크업 생성 코드가 안 깨지길 바라서 썼습니다. 빌드 결과물(`dist/`)은 결국 순수 HTML/CSS/JS입니다.
- **반응형 대응**: 1024px 이하에서는 스크롤 하이재킹을 유지하지 않고 섹션을 세로로 쌓은 뒤, 섹션별 카드 리스트만 `overflow-x: auto` + `scroll-snap-type: x proximity` 기반 네이티브 가로 스와이프로 바꿨습니다. 터치로 하이재킹을 구현하려면 touch 이벤트를 따로 가로채야 해서 iOS Safari 등에서 스크롤이 끊기기 쉽고, 카드가 많아질수록 순수 세로 리스트는 스크롤이 과도하게 길어져서 제외했습니다.

  마우스로 테스트하는 경우(브라우저 창을 좁혀서 보는 경우 등)를 위해 클릭+드래그 스크롤(`dragScroll.ts`)도 섹션별로 붙였습니다. 터치의 네이티브 스크롤에는 관여하지 않고 `pointerType === 'mouse'`일 때만 동작하며, 드래그를 놓으면 CSS `scroll-snap`에 그대로 맡기지 않고 가장 가까운 카드로 직접 `scrollTo({ behavior: 'smooth' })` 시킵니다 — 드래그 직후 바로 스냅에 맡기면 살짝만 움직이고 놓았을 때 순간적으로 튕기듯 되돌아가는 게 눈에 띄어서, 자체적으로 부드럽게 정렬되도록 처리했습니다.
- **카드 콘텐츠를 이모지 + 그라디언트로 채운 이유**: 외부 이미지에 기대면 네트워크 실패나 로딩 시점에 따른 레이아웃 시프트가 생길 수 있어서, CSS/이모지만으로 더미 콘텐츠를 구성했습니다.
- **Lenis(스무스 스크롤)**: "성능/부드러움" 요구사항을 만족시키려고 추가했습니다. 참고 사이트가 쓰는 조합을 그대로 가져온 것이라 별도 실험이 아니라 검증된 선택이라고 판단했습니다.

## 아쉬운 점 / 시간이 더 있었다면 하고 싶었던 것

- Lenis의 `lerp`/`wheelMultiplier` 값을 OS(Mac/Windows)별로 다르게 튜닝하는 건 참고 사이트가 하는 걸 확인했지만 시간 관계상 단일 값으로 남겨뒀습니다. Windows 마우스 휠은 델타가 더 커서 실제로는 OS별 보정이 있는 쪽이 더 자연스러울 수 있습니다.
- 카드로 포커스가 이동할 때(키보드 탭 이동) 가로 스크롤이 따라가는 접근성 처리는 시간 관계상 넣지 못했습니다.
- 섹션 수가 많아지면 하이재킹 구간 전체 스크롤 거리가 길어지는데, 일정 섹션 수 이상부터는 스크롤 속도를 구간별로 다르게 주는 등의 튜닝은 해보지 못했습니다.

## 섹션 수 / 카드 수 추가하는 방법

- **카드 추가**: [src/data/cards.ts](src/data/cards.ts)의 `scrollGroups` 배열에서 원하는 섹션의 `cards` 배열 길이만 늘리면 됩니다(`buildCards(...)`의 개수를 바꾸거나 `CardData` 객체를 직접 추가). 카드 레이아웃이 `flex: 0 0 clamp(...)` 기반이라 개수가 늘어나도 깨지지 않고, 늘어난 만큼 스크롤 거리만 자동으로 늘어납니다.
- **섹션 추가**: `scrollGroups` 배열에 `{ id, eyebrow, title, description, cards }` 형태의 `ScrollGroupData` 객체를 원하는 위치에 추가하면 됩니다. 트랙/트리거/스크롤 거리 계산이 전부 이 배열 길이를 기준으로 다시 이뤄지기 때문에 다른 코드는 건드릴 필요가 없습니다.
- **더미 섹션 추가**: [src/data/dummy.ts](src/data/dummy.ts)의 `dummySections` 배열에 항목을 추가하고, [src/pageSections.ts](src/pageSections.ts)에서 원하는 위치에 `{ type: 'dummy', data: ... }`를 넣으면 됩니다.
