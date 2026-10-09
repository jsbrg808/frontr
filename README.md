# frontr

동전 수집 및 포켓몬 GO("pogo") 데이터 관리를 위한 내부 도구 프론트엔드입니다. React + TypeScript + Vite로 작성되었으며, 별도의 Java 백엔드("ordinal.third")가 제공하는 REST API를 호출하는 얇은 클라이언트입니다.

## 요구 사항

- Node.js
- 백엔드 서버(`ordinal.third`)가 실행 중이어야 합니다.

## 환경 설정

`.env` 파일에 백엔드 주소를 설정합니다.

```
VITE_BACK_BASE_URL=http://localhost:8090
```

## 실행

```bash
npm install
npm run dev
```

Windows에서는 `frontr.bat`을 실행해도 됩니다.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 체크(`tsc -b`) 후 프로덕션 빌드 |
| `npm run lint` | Oxlint 실행 |
| `npm run preview` | 빌드 결과 미리보기 |

## 주요 화면

- `/coin` — 동전 목록
- `/pogo/5f`, `/pogo/5s`, `/pogo/5t` — 포고 테이블 (조회/추가/수정/삭제)
- `/pogo/5de` — 포고 진화 목록
- `/pogo/5pc`, `/pogo/5y` — 엑셀 미리보기 및 셀 편집
- `/pogo/dex` — 포고 도감 업데이트

## 구조

- `src/api/` — 백엔드 호출 클라이언트(`client.ts`)와 응답 타입 정의(`types.ts`)
- `src/pages/` — 라우트별 페이지 컴포넌트
- `src/components/` — 공통 레이아웃
- `src/styles/` — 기능별 CSS 파일

자세한 아키텍처 설명은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
