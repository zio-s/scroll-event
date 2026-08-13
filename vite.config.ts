import { defineConfig } from 'vite'

// GitHub Pages 프로젝트 페이지(https://<user>.github.io/<repo>/)에 배포하기 위해
// base를 저장소 이름으로 맞춥니다. 저장소 이름이 바뀌면 이 값도 함께 바꿔야 합니다.
export default defineConfig({
  base: '/scroll-event/',
})
