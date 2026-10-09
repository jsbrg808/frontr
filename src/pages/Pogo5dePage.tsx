import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import type { Pogo5deVO } from '../api/types'
import '../styles/list.css'

export default function Pogo5dePage() {
  const [list, setList] = useState<Pogo5deVO[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<Pogo5deVO[]>('/api/pogo/5de')
      .then(setList)
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    document.title = `포고 5de (${list.length})`
  }, [list.length])

  if (error) {
    return <p>오류: {error}</p>
  }

  return (
    <table className="list-table pogo5de-table">
      <colgroup>
        <col width="10%" />
        <col width="15%" />
        <col width="5%" />
        <col width="5%" />
        <col width="5%" />
        <col width="15%" />
        <col width="5%" />
        <col width="5%" />
        <col width="5%" />
        <col width="15%" />
        <col width="5%" />
        <col width="5%" />
        <col width="5%" />
      </colgroup>
      <thead>
        <tr>
          <th>name</th>
          <th>5f dup</th>
          <th colSpan={3}>5f evo</th>
          <th>5s dup</th>
          <th colSpan={3}>5s evo</th>
          <th>5t dup</th>
          <th colSpan={3}>5t evo</th>
        </tr>
      </thead>
      <tbody>
        {list.map((row, idx) => (
          <tr key={idx}>
            <td className="name">{row.name}</td>
            <td className="bg-f">{row.pogo5fDup}</td>
            <td className="bg-f">{row.pogo5fEvoByGender[0]}</td>
            <td className="bg-f">{row.pogo5fEvoByGender[1]}</td>
            <td className="bg-f">{row.pogo5fEvoByGender[2]}</td>
            <td className="bg-s">{row.pogo5sDup}</td>
            <td className="bg-s">{row.pogo5sEvoByGender[0]}</td>
            <td className="bg-s">{row.pogo5sEvoByGender[1]}</td>
            <td className="bg-s">{row.pogo5sEvoByGender[2]}</td>
            <td className="bg-t">{row.pogo5tDup}</td>
            <td className="bg-t">{row.pogo5tEvoByGender[0]}</td>
            <td className="bg-t">{row.pogo5tEvoByGender[1]}</td>
            <td className="bg-t">{row.pogo5tEvoByGender[2]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
