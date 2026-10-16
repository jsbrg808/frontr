import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BACK_BASE_URL, apiGet, apiUrl, apiPostForm, apiPostJson, apiPostQuery, toBackApiPath } from './client'

// setup.ts에서 VITE_BACK_BASE_URL=http://back.test 를 세팅하므로 정적 import가 안전하다.
describe('BACK_BASE_URL', () => {
  it('환경변수에서 백엔드 기본 URL을 읽는다', () => {
    expect(BACK_BASE_URL).toBe('http://back.test')
  })
})

describe('apiUrl', () => {
  it('기본 URL과 경로를 합쳐 전체 URL을 만든다', () => {
    expect(apiUrl('/api/pogo/5f')).toBe('http://back.test/api/pogo/5f')
  })

  it('쿼리 파라미터를 URL에 붙인다', () => {
    expect(apiUrl('/api/pogo/5f', { srchNm: '피카츄', srlNo: '10' })).toBe(
      'http://back.test/api/pogo/5f?srchNm=%ED%94%BC%EC%B9%B4%EC%B8%84&srlNo=10',
    )
  })

  it('undefined와 빈 문자열 파라미터는 URL에 붙이지 않는다', () => {
    expect(apiUrl('/api/pogo/5f', { srchNm: undefined, srlNo: '' })).toBe('http://back.test/api/pogo/5f')
  })
})

describe('toBackApiPath', () => {
  // back이 엑셀 미리보기 응답에 내려주는 downloadPath/savePath는
  // frontt 프록시 라우트 기준 경로이므로 back의 실제 API 경로로 보정해야 한다.
  it('frontt 프록시 경로를 back의 실제 API 경로로 보정한다', () => {
    expect(toBackApiPath('/pogo/5pc/download')).toBe('/api/pogo/5pc/download')
    expect(toBackApiPath('/pogo/5y/save')).toBe('/api/pogo/5y/save')
  })
})

describe('HTTP 함수', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('apiGet은 성공 시 JSON을 파싱해 반환한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ pogo5TableList: [], tbl: '5f' }))
    await expect(apiGet('/api/pogo/5f')).resolves.toEqual({ pogo5TableList: [], tbl: '5f' })
  })

  it('apiGet은 실패 시 백엔드의 message로 Error를 던진다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: '조회에 실패했습니다' }, 500))
    await expect(apiGet('/api/pogo/5f')).rejects.toThrow('조회에 실패했습니다')
  })

  it('message가 없는 실패 응답은 기본 문구와 상태 코드로 Error를 던진다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503))
    await expect(apiGet('/api/pogo/5f')).rejects.toThrow('요청이 실패했습니다 (503)')
  })

  it('apiPostForm은 form-urlencoded 형식으로 본문을 전송한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await expect(apiPostForm('/api/pogo/5f/append', { als: 'X1Lv10피카', formNo: '', alph: 'M' })).resolves.toEqual({
      ok: true,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://back.test/api/pogo/5f/append')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded')
    const body = init.body as URLSearchParams
    expect(body.get('als')).toBe('X1Lv10피카')
    expect(body.get('formNo')).toBe('')
    expect(body.get('alph')).toBe('M')
  })

  it('apiPostQuery는 쿼리 파라미터를 URL에 담아 POST한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    await expect(apiPostQuery('/api/pogo/dex/update', { step1: 'true' })).resolves.toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://back.test/api/pogo/dex/update?step1=true')
    expect(init.method).toBe('POST')
    expect(init.body).toBeUndefined()
  })

  it('apiPostJson은 JSON 형식으로 본문을 전송한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
    const data = { no: 35, dv: null, field: 'name', value: '0036' }
    await expect(apiPostJson('/api/pogo/5pc/save', data)).resolves.toEqual({ ok: true })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://back.test/api/pogo/5pc/save')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual(data)
  })
})
