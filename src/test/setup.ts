import { vi } from 'vitest'

// client.ts는 모듈 로드 시(import 시점) 환경변수를 읽어 BACK_BASE_URL로 고정하므로,
// 어떤 테스트보다 먼저 실행되는 이 setup에서 환경변수를 세팅해 둔다.
vi.stubEnv('VITE_BACK_BASE_URL', 'http://back.test')

// jsdom은 scrollIntoView를 구현하지 않으므로, 호출 여부와 인자를 검증할 수 있게 스텁한다.
Element.prototype.scrollIntoView = vi.fn()
