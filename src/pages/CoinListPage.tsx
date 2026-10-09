import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import type { CoinListResponse } from '../api/types'
import '../styles/list.css'

export default function CoinListPage() {
  const [data, setData] = useState<CoinListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = '동전'
    apiGet<CoinListResponse>('/api/coin')
      .then(setData)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return <p>오류: {error}</p>
  }
  if (!data) {
    return <p>불러오는 중...</p>
  }

  return (
    <table className="list-table" width="100%">
      <colgroup>
        <col width="20%" />
        <col width="40%" />
        <col width="10%" />
        <col width="10%" />
        <col width="10%" />
        <col width="10%" />
      </colgroup>
      <tbody>
        {data.coinConts.map((cont) => {
          return (
            <>
              <tr key={`cont-${cont.contNo}`}>
                <th align="center" colSpan={6}>
                  {cont.contName}
                </th>
              </tr>
              {cont.ctrys.map((ctry) =>
                ctry.coins.map((coin, coinIdx) =>
                  coin.coinYearRows.map((yearRow, rowIdx) => {
                    const isFirstRow = rowIdx === 0
                    return (
                      <tr key={`${ctry.ctryNo}-${coin.coinNo}-${rowIdx}`}>
                        {coinIdx === 0 && isFirstRow ? (
                          <td rowSpan={ctry.totalYearRowCount} align="left" className="listtd">
                            {ctry.ctryName}
                          </td>
                        ) : null}
                        {isFirstRow ? (
                          <td rowSpan={coin.yearRowCount} align="left" className="listtd">
                            <span>{coin.coinName}</span>
                            {coin.coinEtc ? (
                              <>
                                <br />
                                <em>{coin.coinEtc}</em>
                              </>
                            ) : null}
                          </td>
                        ) : null}
                        {[0, 1, 2, 3].map((i) => (
                          <td className="listtd" align="center" key={i}>
                            {i < yearRow.length ? (
                              <>
                                <span>{yearRow[i][0]}</span>
                                {yearRow[i][1] ? (
                                  <>
                                    <br />
                                    <em>{yearRow[i][1]}</em>
                                  </>
                                ) : null}
                              </>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    )
                  }),
                ),
              )}
              <tr key={`cont-total-${cont.contNo}`}>
                <td align="center" className="listtd">
                  <b>{cont.ctryCount}</b>
                </td>
                <td align="center" className="listtd">
                  <b>{cont.coinCount}</b>
                </td>
                <td align="center" className="listtd" colSpan={4}>
                  <b>{cont.yearCount}</b>
                </td>
              </tr>
            </>
          )
        })}
        <tr>
          <th align="center" colSpan={6}>
            총
          </th>
        </tr>
        <tr>
          <td align="center" className="listtd">
            <b>{data.totalCtrys}</b>
          </td>
          <td align="center" className="listtd">
            <b>{data.totalCoins}</b>
          </td>
          <td align="center" className="listtd" colSpan={4}>
            <b>{data.totalYears}</b>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
