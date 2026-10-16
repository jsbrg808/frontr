import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PogoExcelPreviewPage from './PogoExcelPreviewPage'
import type { PogoExcelPreview } from '../api/types'

const preview: PogoExcelPreview = {
  title: '테스트 엑셀',
  downloadPath: '/pogo/5pc/download',
  columnWidths: [120],
  tableWidth: 500,
  rows: [
    {
      cells: [
        {
          value: '0035',
          style: 'color: red; font-weight: bold',
          colSpan: 1,
          rowSpan: 1,
          editable: true,
          savePath: '/pogo/5pc/save',
          no: '35',
          dv: null,
          field: 'name',
        },
      ],
    },
  ],
}

describe('PogoExcelPreviewPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  async function renderWithPreview() {
    fetchMock.mockImplementation(async () => jsonResponse(preview))
    const { container } = render(<PogoExcelPreviewPage type="5pc" />)
    // title은 document.title로만 노출되고 화면에는 렌더링되지 않으므로 다른 요소를 기다린다
    await screen.findByText('엑셀 다운로드')
    return container
  }

  it('미리보기 데이터를 로드해 렌더링한다', async () => {
    const container = await renderWithPreview()
    expect(fetchMock).toHaveBeenCalledWith('http://back.test/api/pogo/5pc/preview')
    expect(screen.getByText('0035')).toBeTruthy()
    expect(container).toBeTruthy()
  })

  it('downloadPath를 back의 실제 API 경로로 보정해 다운로드 링크를 만든다', async () => {
    await renderWithPreview()
    const link = screen.getByText('엑셀 다운로드')
    expect(link.getAttribute('href')).toBe('http://back.test/api/pogo/5pc/download')
  })

  it('style 문자열을 inline style로 파싱한다(카멜케이스 변환 확인)', async () => {
    const container = await renderWithPreview()
    const td = container.querySelector('td.editable') as HTMLTableCellElement
    expect(td).toBeTruthy()
    expect(td.style.color).toBe('red')
    expect(td.style.fontWeight).toBe('bold')
    expect(td.getAttribute('contentEditable')).toBe('true')
  })

  it('셀 값 변경 후 blur하면 savePath를 보정해 저장 API를 호출한다', async () => {
    const container = await renderWithPreview()
    const td = container.querySelector('td.editable') as HTMLTableCellElement

    fetchMock.mockImplementation(async (url) =>
      url === 'http://back.test/api/pogo/5pc/preview' ? jsonResponse(preview) : jsonResponse({ ok: true }),
    )
    td.focus()
    td.innerText = '0036'
    td.blur()

    await waitFor(
      () => {
        expect(td.className).toContain('saved')
      },
      { timeout: 2000 },
    )

    const saveCall = fetchMock.mock.calls.find(
      ([url]: string[]) => url === 'http://back.test/api/pogo/5pc/save',
    )
    expect(saveCall).toBeTruthy()
    const [url, init] = saveCall as [string, RequestInit]
    expect(url).toBe('http://back.test/api/pogo/5pc/save')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({ no: 35, dv: null, field: 'name', value: '0036' })
  })

  it('값이 바뀌지 않은 blur는 저장 API를 호출하지 않는다', async () => {
    const container = await renderWithPreview()
    const td = container.querySelector('td.editable') as HTMLTableCellElement

    td.focus()
    td.innerText = '0035'
    td.blur()
    await waitFor(
      () => {
        expect(td.className).not.toContain('saving')
      },
      { timeout: 2000 },
    )

    expect(td.className).toContain('editable')
    expect(td.className).not.toContain('error')
  })

  it('저장 실패 시 셀에 error 클래스를 붙인다', async () => {
    const container = await renderWithPreview()
    const td = container.querySelector('td.editable') as HTMLTableCellElement

    fetchMock.mockImplementation(async (url) =>
      url === 'http://back.test/api/pogo/5pc/preview'
        ? jsonResponse(preview)
        : jsonResponse({ message: '저장 실패입니다' }, 500),
    )
    td.focus()
    td.innerText = '9999'
    td.blur()

    await waitFor(
      () => {
        expect(td.className).toContain('error')
      },
      { timeout: 2000 },
    )
    expect(td.getAttribute('title')).toBe('저장 실패입니다')
  })
})
