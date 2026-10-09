// back(ordinal.third)의 REST 응답 구조에 대응하는 타입 정의

export interface CoinYearPair {
  0: string
  1: string
}

export interface CoinVO {
  contNo: string
  ctryNo: string
  coinNo: string
  coinYears: string | null
  coinYear2s: string | null
  contName: string
  ctryName: string
  coinName: string
  coinEtc: string | null
  ctryCnt: string | null
  coinYearPairs: [string, string][]
  yearRowCount: number
  coinYearRows: [string, string][][]
}

export interface CoinCtryVO {
  ctryNo: string
  ctryName: string
  coins: CoinVO[]
  coinCount: number
  yearCount: number
  totalYearRowCount: number
}

export interface CoinContVO {
  contNo: string
  contName: string
  ctrys: CoinCtryVO[]
  ctryCount: number
  coinCount: number
  yearCount: number
}

export interface CoinListResponse {
  coinConts: CoinContVO[]
  totalCtrys: number
  totalCoins: number
  totalYears: number
}

// pogo 5f / 5s / 5t 테이블
export interface Pogo5TableVO {
  srlNo: number
  als: string | null
  formNo: string | null
  alph: string | null
  gender: string | null
  lvl: string | null
  id: string | null
  iv: string | null
  imgSrc: string | null
  imgAlt: string | null
  name: string | null
  srchNm: string | null
}

export interface Pogo5TableListResponse {
  pogo5TableList: Pogo5TableVO[]
  tbl: string
  srchNm?: string
}

export type Pogo5Tbl = '5f' | '5s' | '5t'

// pogo 5de (진화 목록)
export interface Pogo5deVO {
  baseNo: string
  dv: string
  name: string
  pogo5fDup: string
  pogo5fEvo: string
  pogo5sDup: string
  pogo5sEvo: string
  pogo5tDup: string
  pogo5tEvo: string
  pogo5fEvoByGender: [string, string, string]
  pogo5sEvoByGender: [string, string, string]
  pogo5tEvoByGender: [string, string, string]
}

// 엑셀 미리보기 (5pc / 5y)
export interface PogoExcelPreviewCell {
  value: string | null
  style: string | null
  colSpan: number
  rowSpan: number
  editable: boolean
  savePath: string | null
  no: string | null
  dv: string | null
  field: string | null
}

export interface PogoExcelPreviewRow {
  cells: PogoExcelPreviewCell[]
}

export interface PogoExcelPreview {
  title: string
  downloadPath: string
  columnWidths: number[]
  tableWidth: number
  rows: PogoExcelPreviewRow[]
}

// 도감 업데이트
export const POKEDEX_STEP_KEYS = [
  'step1',
  'step1_5',
  'step1_6',
  'step2',
  'step2_5',
  'step3',
  'step3_1',
  'moveSets',
] as const

export type PokedexStepKey = (typeof POKEDEX_STEP_KEYS)[number]

export interface PokedexStepResult {
  ok?: boolean
  status?: string
  message?: string
  details?: string[]
  [countKey: string]: unknown
}

export interface PokedexUpdateResponse {
  ok: boolean
  message?: string
  status?: string
  step1?: PokedexStepResult
  step1_5?: PokedexStepResult
  step1_6?: PokedexStepResult
  step2?: PokedexStepResult
  step2_5?: PokedexStepResult
  step3?: PokedexStepResult
  step3_1?: PokedexStepResult
  moveSets?: PokedexStepResult
}
