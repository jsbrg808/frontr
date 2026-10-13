import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiGet, apiPostForm } from '../api/client'
import type { Pogo5TableListResponse, Pogo5TableVO, Pogo5Tbl } from '../api/types'
import '../styles/list.css'

// als 포맷: X<gender(1)><lvl(2)><name>[ <iv>]
export default function Pogo5TablePage() {
  const { tbl } = useParams<{ tbl: Pogo5Tbl }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [list, setList] = useState<Pogo5TableVO[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedSrlNo, setSelectedSrlNo] = useState<number | null>(null)
  const [srchNm, setSrchNm] = useState(searchParams.get('srchNm') ?? '')
  const [inpDefault, setInpDefault] = useState('')
  const [inpFor, setInpFor] = useState('')
  const [inpAlp, setInpAlp] = useState('')
  const [insertInputs, setInsertInputs] = useState<Record<number, { als: string; formNo: string; alph: string }>>({})

  const rowRefs = useRef<Record<number, HTMLTableCellElement | null>>({})
  const inpDefaultRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!tbl) return
    setSrchNm(searchParams.get('srchNm') ?? '')
    const query = searchParams.get('srchNm') ? { srchNm: searchParams.get('srchNm') ?? '' } : undefined
    apiGet<Pogo5TableListResponse>(`/api/pogo/${tbl}`, query)
      .then((data) => {
        setList(data.pogo5TableList)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
  }, [tbl, searchParams])

  useEffect(() => {
    document.title = `포고 ${tbl} (${list.length})`
  }, [tbl, list.length])

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const el = document.querySelector(hash)
      el?.scrollIntoView({ block: 'center' })
    }
  }, [list])

  if (!tbl) {
    return null
  }

  const reload = (srlNo?: number) => {
    // frontt는 작업 후 redirect로 검색 조건 없이 전체 목록을 다시 렌더링한다(해시는 작업 대상 행만 남김).
    navigate(`/pogo/${tbl}${srlNo !== undefined ? `#srlNo${srlNo}` : ''}`, { replace: true })
    apiGet<Pogo5TableListResponse>(`/api/pogo/${tbl}`)
      .then((data) => setList(data.pogo5TableList))
      .catch((err: Error) => setError(err.message))
  }

  const handleSearch = () => {
    navigate(`/pogo/${tbl}${srchNm ? `?srchNm=${encodeURIComponent(srchNm)}` : ''}`)
    // frontt(fnSrch → 전체 리로드)와 동일하게 포커스를 해제한다
    const active = document.activeElement as HTMLElement | null
    active?.blur()
  }

  // 작업 성공 후 frontt(전체 페이지 리로드)와 동일하게: 상단 입력·검색어 초기화, 선택 해제, 포커스 해제
  const resetAfterAction = () => {
    setInpDefault('')
    setInpFor('')
    setInpAlp('')
    setSelectedSrlNo(null)
    setSrchNm('')
    const active = document.activeElement as HTMLElement | null
    active?.blur()
  }

  const handleAppend = async () => {
    try {
      await apiPostForm(`/api/pogo/${tbl}/append`, { als: inpDefault, formNo: inpFor, alph: inpAlp })
      resetAfterAction()
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleUpdate = async () => {
    if (selectedSrlNo === null) return
    const srlNo = selectedSrlNo
    try {
      await apiPostForm(`/api/pogo/${tbl}/update`, {
        srlNo: String(srlNo),
        als: inpDefault,
        formNo: inpFor,
        alph: inpAlp,
      })
      resetAfterAction()
      reload(srlNo)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDelete = async (srlNo: number) => {
    try {
      await apiPostForm(`/api/pogo/${tbl}/delete`, { srlNo: String(srlNo) })
      resetAfterAction()
      reload(srlNo)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleInsert = async (srlNo: number) => {
    const values = insertInputs[srlNo] ?? { als: '', formNo: '', alph: '' }
    try {
      await apiPostForm(`/api/pogo/${tbl}/insert`, { srlNo: String(srlNo), ...values })
      // 해당 행의 삽입 입력 초기화(frontt는 전체 리로드로 빈 값이 됨)
      setInsertInputs((prev) => ({ ...prev, [srlNo]: { als: '', formNo: '', alph: '' } }))
      resetAfterAction()
      reload(srlNo)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleSelect = (item: Pogo5TableVO) => {
    setSelectedSrlNo(item.srlNo)
    setInpDefault(item.als ?? '')
    setInpFor(item.formNo ?? '')
    setInpAlp(item.alph ?? '')
    // frontt(fnSelect → inpDefault focus)와 동일하게
    inpDefaultRef.current?.focus()
  }

  const rows: Pogo5TableVO[][] = []
  for (let i = 0; i < list.length; i += 3) {
    rows.push(list.slice(i, i + 3))
  }

  return (
    <>
      {error ? <p>오류: {error}</p> : null}
      <table className="list-table pogo5">
        <thead>
          <tr>
            <th>
              <input
                type="text"
                className="inp-srch"
                value={srchNm}
                onChange={(e) => setSrchNm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
              />
              <br />
              <a onClick={handleSearch}>확인</a>
            </th>
            <th>
              <input type="text" className="inp-als" value={inpDefault} ref={inpDefaultRef} onChange={(e) => setInpDefault(e.target.value)} />
              {' / '}
              <input type="text" className="inp-for" value={inpFor} onChange={(e) => setInpFor(e.target.value)} />
              {' / '}
              <input type="text" className="inp-alp" value={inpAlp} onChange={(e) => setInpAlp(e.target.value)} />
              <br />
              <a onClick={handleAppend}>추가</a> / <a onClick={handleUpdate}>변경</a>
            </th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((rowItems, rowIdx) => (
            <tr key={rowIdx}>
              {rowItems.map((item) => (
                <>
                  <td
                    key={`cell-${item.srlNo}`}
                    id={`srlNo${item.srlNo}`}
                    ref={(el) => {
                      rowRefs.current[item.srlNo] = el
                    }}
                    onClick={() => handleSelect(item)}
                  >
                    {item.imgSrc ? (
                      <img src={item.imgSrc} alt={item.imgAlt ?? ''} />
                    ) : (
                      <span className="img-placeholder">대체 {item.imgAlt}</span>
                    )}
                    <br />
                    <input type="text" className="inp-als" value={item.als ?? ''} disabled />
                    {' / '}
                    <input type="text" className="inp-for" value={item.formNo ?? ''} disabled />
                    {' / '}
                    <input type="text" className="inp-alp" value={item.alph ?? ''} disabled />
                    <br />
                    <a onClick={() => handleDelete(item.srlNo)}>삭제</a>
                  </td>
                  <td key={`insert-${item.srlNo}`}>
                    <input
                      type="text"
                      className="inp-als"
                      value={insertInputs[item.srlNo]?.als ?? ''}
                      onChange={(e) =>
                        setInsertInputs((prev) => ({
                          ...prev,
                          [item.srlNo]: { ...(prev[item.srlNo] ?? { als: '', formNo: '', alph: '' }), als: e.target.value },
                        }))
                      }
                    />
                    {' / '}
                    <input
                      type="text"
                      className="inp-for"
                      value={insertInputs[item.srlNo]?.formNo ?? ''}
                      onChange={(e) =>
                        setInsertInputs((prev) => ({
                          ...prev,
                          [item.srlNo]: { ...(prev[item.srlNo] ?? { als: '', formNo: '', alph: '' }), formNo: e.target.value },
                        }))
                      }
                    />
                    {' / '}
                    <input
                      type="text"
                      className="inp-alp"
                      value={insertInputs[item.srlNo]?.alph ?? ''}
                      onChange={(e) =>
                        setInsertInputs((prev) => ({
                          ...prev,
                          [item.srlNo]: { ...(prev[item.srlNo] ?? { als: '', formNo: '', alph: '' }), alph: e.target.value },
                        }))
                      }
                    />
                    <br />
                    <a onClick={() => handleInsert(item.srlNo)}>삽입</a>
                  </td>
                </>
              ))}
              {rowItems.length < 3
                ? Array.from({ length: 3 - rowItems.length }).map((_, i) => (
                    <>
                      <td key={`empty-a-${i}`}></td>
                      <td key={`empty-b-${i}`}></td>
                    </>
                  ))
                : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
