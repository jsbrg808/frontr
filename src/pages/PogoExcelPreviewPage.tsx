import { useEffect, useRef, useState } from 'react'
import { apiGet, apiPostJson, apiUrl, toBackApiPath } from '../api/client'
import type { PogoExcelPreview } from '../api/types'
import '../styles/toolbar.css'
import '../styles/pogoExcelPreview.css'

type CellState = 'idle' | 'editing' | 'saving' | 'saved' | 'error'

export default function PogoExcelPreviewPage({ type }: { type: '5pc' | '5y' }) {
  const [preview, setPreview] = useState<PogoExcelPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const originalValues = useRef<Record<string, string>>({})
  const [cellState, setCellState] = useState<Record<string, CellState>>({})
  const [cellError, setCellError] = useState<Record<string, string>>({})

  useEffect(() => {
    apiGet<PogoExcelPreview>(`/api/pogo/${type}/preview`)
      .then((data) => {
        setPreview(data)
        document.title = data.title
      })
      .catch((err: Error) => setError(err.message))
  }, [type])

  if (error) {
    return <p>오류: {error}</p>
  }
  if (!preview) {
    return <p>불러오는 중...</p>
  }

  const handleFocus = (key: string, e: React.FocusEvent<HTMLTableCellElement>) => {
    // 매 focus마다 현재 DOM 텍스트(마지막 저장값 포함)로 기준값을 다시 잡는다.
    // preview state의 cell.value는 최초 로드 시점 값이라 저장 후에도 갱신되지 않는다.
    originalValues.current[key] = (e.currentTarget.innerText ?? '').trim()
    setCellState((prev) => ({ ...prev, [key]: 'editing' }))
    setCellError((prev) => ({ ...prev, [key]: '' }))
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTableCellElement>,
    key: string,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.innerText = originalValues.current[key] ?? ''
      e.currentTarget.blur()
    }
  }

  const handleBlur = async (
    e: React.FocusEvent<HTMLTableCellElement>,
    savePath: string,
    no: string | null,
    dv: string | null,
    field: string | null,
    key: string,
  ) => {
    const value = (e.currentTarget.innerText ?? '').trim()
    const original = originalValues.current[key] ?? ''
    setCellState((prev) => ({ ...prev, [key]: 'idle' }))
    if (value === original) {
      return
    }
    setCellState((prev) => ({ ...prev, [key]: 'saving' }))
    try {
      await apiPostJson(toBackApiPath(savePath), { no: Number(no), dv, field, value })
      originalValues.current[key] = value
      setCellState((prev) => ({ ...prev, [key]: 'saved' }))
    } catch (err) {
      setCellState((prev) => ({ ...prev, [key]: 'error' }))
      setCellError((prev) => ({ ...prev, [key]: (err as Error).message }))
    }
  }

  return (
    <div className="toolbar-scope">
      <div className="toolbar">
        <a className="download" href={apiUrl(toBackApiPath(preview.downloadPath))}>
          엑셀 다운로드
        </a>
      </div>
      <div className="excel-preview-wrap">
        <table
          className="excel-preview"
          style={{ width: preview.tableWidth, minWidth: preview.tableWidth }}
        >
          <colgroup>
            {preview.columnWidths.map((width, idx) => (
              <col key={idx} style={{ width }} />
            ))}
          </colgroup>
          <tbody>
            {preview.rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.cells.map((cell, cellIdx) => {
                  const key = `${rowIdx}-${cellIdx}`
                  const state = cellState[key] ?? 'idle'
                  const classNames = [
                    cell.editable ? 'editable' : '',
                    state === 'editing' ? 'editing' : '',
                    state === 'saving' ? 'saving' : '',
                    state === 'saved' ? 'saved' : '',
                    state === 'error' ? 'error' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <td
                      key={cellIdx}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={classNames || undefined}
                      style={cell.style ? parseInlineStyle(cell.style) : undefined}
                      contentEditable={cell.editable}
                      suppressContentEditableWarning
                      title={cellError[key] ?? ''}
                      onFocus={(e) => handleFocus(key, e)}
                      onKeyDown={(e) => handleKeyDown(e, key)}
                      onBlur={(e) =>
                        cell.savePath
                          ? handleBlur(e, cell.savePath, cell.no, cell.dv, cell.field, key)
                          : undefined
                      }
                    >
                      {cell.value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function parseInlineStyle(style: string): React.CSSProperties {
  const result: Record<string, string> = {}
  style
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((rule) => {
      const [prop, value] = rule.split(':').map((s) => s.trim())
      if (!prop || value === undefined) return
      const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      result[camelProp] = value
    })
  return result as React.CSSProperties
}
