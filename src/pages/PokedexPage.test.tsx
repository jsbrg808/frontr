import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PokedexPage from './PokedexPage'
import { POKEDEX_STEP_KEYS } from '../api/types'

// 각 스텝은 응답의 자기 키 값만 읽으므로, 스텝 키별로 결과를 중첩해 내려준다.
const stepResult = {
  ok: true,
  status: 'LATEST',
  step1: { status: 'LATEST', insertedCount: 100 },
  step1_5: { updatedCount: 5 },
  step1_6: {},
  step2: { status: 'LATEST', insertedCount: 100 },
  step2_5: { updatedCount: 5 },
  step3: { upsertedCount: 3 },
  step3_1: { updatedCount: 5 },
  moveSets: { status: 'LATEST', pokemonCount: 205, combinationCount: 900, insertedCount: 100 },
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PokedexPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let alertMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('마운트 시 모든 스텝 체크박스가 기본 선택 상태다', () => {
    render(<PokedexPage />)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes).toHaveLength(POKEDEX_STEP_KEYS.length)
    checkboxes.forEach((cb) => expect(cb.checked).toBe(true))
  })

  it('선택된 스텝이 없으면 alert를 띄우고 API를 호출하지 않는다', async () => {
    const user = userEvent.setup()
    render(<PokedexPage />)

    for (const cb of screen.getAllByRole('checkbox')) {
      await user.click(cb)
    }
    await user.click(screen.getByText('도감 업데이트'))

    expect(alertMock).toHaveBeenCalledWith('실행할 스텝을 최소 하나 이상 선택해 주세요.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('선택(기본: 전체)된 스텝을 순서대로 실행하며, 스텝별 파라미터와 결과 로그를 남긴다', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(stepResult))

    const user = userEvent.setup()
    render(<PokedexPage />)

    await user.click(screen.getByText('도감 업데이트'))

    await screen.findByText(/도감 업데이트 종료/)

    // 모든 스텝(기본 전체 선택)이 순서대로 실행된다
    expect(fetchMock).toHaveBeenCalledTimes(POKEDEX_STEP_KEYS.length)
    POKEDEX_STEP_KEYS.forEach((key, i) => {
      const [url] = fetchMock.mock.calls[i] as [string]
      const u = new URL(url)
      expect(u.pathname).toBe('/api/pogo/dex/update')
      expect(u.searchParams.get(key)).toBe('true')
      expect(u.searchParams.size).toBe(1)
    })

    expect(screen.getByText(/도감 업데이트 시작/)).toBeTruthy()
    expect(screen.getByText(/스텝1 시작/)).toBeTruthy()
    expect(screen.getByText(/스텝1 정상 종료/)).toBeTruthy()
    expect(screen.getByText(/스텝4 정상 종료/)).toBeTruthy()
    // 성공 시 결과 카운트가 로그에 포맷팅되어 표시된다(100건 / 205마리 / 900개 등)
    expect(screen.getAllByText(/100건/).length).toBeGreaterThan(0)
    expect(screen.getByText(/205마리/)).toBeTruthy()
    expect(screen.getByText(/900개/)).toBeTruthy()
    expect(screen.queryByText(/오류:/)).toBeNull()
  })

  it('스텝 실행이 실패하면 이후 스텝을 실행하지 않고 실패 로그를 남긴다', async () => {
    let callCount = 0
    fetchMock.mockImplementation(async () => {
      callCount += 1
      if (callCount === 1) {
        return jsonResponse({ ok: true, status: 'LATEST', insertedCount: 1 })
      }
      throw new Error('스텝2 처리 실패')
    })

    const user = userEvent.setup()
    render(<PokedexPage />)

    await user.click(screen.getByText('도감 업데이트'))

    // 두 번째 스텝(step1_5)에서 실패하면 이후 스텝은 호출되지 않는다
    await screen.findByText(/스텝1.5 실패 종료/)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/오류: 스텝2 처리 실패/)).toBeTruthy()
    expect(screen.getByText(/도감 업데이트 시작/)).toBeTruthy()
    // 전체 종료 로그는 남지 않는다
    expect(screen.queryByText(/도감 업데이트 종료/)).toBeNull()
  })
})
