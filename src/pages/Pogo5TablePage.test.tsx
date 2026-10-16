import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Pogo5TablePage from './Pogo5TablePage'
import type { Pogo5TableListResponse } from '../api/types'

function item(srlNo: number, overrides: Partial<Pogo5TableListResponse['pogo5TableList'][number]> = {}) {
  return {
    srlNo,
    als: `X2Lv10포켓몬${srlNo}`,
    formNo: `form-${srlNo}`,
    alph: srlNo % 2 === 0 ? 'F' : 'M',
    ...overrides,
  } as Pogo5TableListResponse['pogo5TableList'][number]
}

function listResponse(items: Pogo5TableListResponse['pogo5TableList']): Pogo5TableListResponse {
  return { pogo5TableList: items, tbl: '5f' }
}

function renderPage(initialEntry = '/pogo/5f') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/pogo/:tbl" element={<Pogo5TablePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Pogo5TablePage', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('마운트 시 해당 테이블 목록을 조회해 렌더링하고 문서 제목을 설정한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(listResponse([item(1), item(2), item(3), item(4)])))
    renderPage()

    expect(fetchMock.mock.calls[0][0]).toBe('http://back.test/api/pogo/5f')

    await waitFor(() => {
      expect(document.title).toBe('포고 5f (4)')
    })
    expect(screen.getAllByDisplayValue('X2Lv10포켓몬1').length).toBeGreaterThan(0)
  })

  it('조회 실패 시 백엔드 메시지를 오류 문구로 표시한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: '목록 조회 실패' }, 500))
    renderPage()

    await screen.findByText(/오류: 목록 조회 실패/)
  })

  it('행 선택 시 상단 입력란에 채워지고 포커스가 맞춰진다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(listResponse([item(10)])))
    const user = userEvent.setup()
    renderPage()

    const rowInput = await screen.findAllByDisplayValue('X2Lv10포켓몬10')
    await user.click(rowInput[0].closest('td') as HTMLTableCellElement)

    const alsInput = document.querySelector<HTMLInputElement>('thead input.inp-als')
    await waitFor(() => {
      // 상단 3개 입력(als/for/alp) 중 첫 번째가 선택한 행 값으로 채워진다
      const topAlp = Array.from(document.querySelectorAll<HTMLInputElement>('thead input')).at(-1)
      expect(topAlp?.value).toBe('F')
    })
    expect(document.activeElement).toBe(alsInput)
  })

  it('추가 클릭 시 해당 테이블의 append API를 form-urlencoded로 호출하고 목록을 다시 조회한다', async () => {
    let listVersion = 0
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url === 'http://back.test/api/pogo/5f/append') {
        return jsonResponse({ ok: true })
      }
      // 재조회 시 데이터가 늘어난 목록을 내려준다
      listVersion += 1
      return jsonResponse(listResponse(listVersion > 1 ? [item(1), item(2)] : [item(1)]))
    })

    const user = userEvent.setup()
    renderPage()

    await waitFor(() => {
      expect(document.title).toBe('포고 5f (1)')
    })

    // 검색 입력(.inp-srch)을 제외한 상단 3개 입력(als/for/alp)에 값을 넣는다
    const topInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('thead input:not(.inp-srch)'),
    )
    expect(topInputs).toHaveLength(3)
    await user.type(topInputs[0], 'X1Lv10파비코')
    await user.type(topInputs[1], '0226')
    await user.type(topInputs[2], 'M')

    await user.click(screen.getByText('추가'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    const appendCall = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === 'POST',
    )
    const [url, init] = appendCall as [string, RequestInit]
    expect(url).toBe('http://back.test/api/pogo/5f/append')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded')
    const body = init.body as URLSearchParams
    expect(body.get('als')).toBe('X1Lv10파비코')
    expect(body.get('formNo')).toBe('0226')
    expect(body.get('alph')).toBe('M')

    // 재조회 후 문서 제목과 목록이 갱신된다
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('X2Lv10포켓몬2').length).toBeGreaterThan(0)
    })
  })

  it('검색어 입력 후 Enter를 누르면 srchNm 쿼리로 재조회한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(listResponse([item(1)])))
    const user = userEvent.setup()
    renderPage()

    const searchInput = document.querySelector<HTMLInputElement>('input.inp-srch') as HTMLInputElement
    await user.type(searchInput, '피카츄')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      const searchCalls = fetchMock.mock.calls
        .map(([url]) => new URL(url as string))
        .filter((u) => u.pathname === '/api/pogo/5f' && u.searchParams.has('srchNm'))
      expect(searchCalls.length).toBeGreaterThan(0)
      expect(searchCalls[0].searchParams.get('srchNm')).toBe('피카츄')
    })
  })

  it('목록 로드 시 해시 경로의 행을 최상단으로 스크롤한다', async () => {
    window.location.hash = '#srlNo7'
    fetchMock.mockResolvedValue(jsonResponse(listResponse([item(7)])))

    try {
      renderPage()

      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
      })
    } finally {
      window.location.hash = ''
    }
  })
})
