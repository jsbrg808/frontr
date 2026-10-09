import { useEffect, useRef, useState } from 'react'
import { apiPostQuery } from '../api/client'
import type { PokedexStepKey, PokedexStepResult, PokedexUpdateResponse } from '../api/types'
import '../styles/toolbar.css'
import '../styles/pokedex.css'

interface StepDef {
  key: PokedexStepKey
  label: string
  logMessages: (d: PokedexStepResult) => string[]
}

function formatCount(value: unknown): string {
  return Number(value || 0).toLocaleString('ko-KR')
}

const STEPS: StepDef[] = [
  {
    key: 'step1',
    label: '스텝1',
    logMessages: (d) => [
      d.status === 'LATEST'
        ? '원본 처리: pokedex.json 최신 상태 확인, 기존 파일 재사용'
        : '원본 처리: pokedex.json 신규 다운로드 완료',
      '데이터 처리: 기본형·지역 폼 파싱 및 암컷 이미지(image_g2) 매핑 완료',
      `결과: pokedex_json 테이블 전체 교체 적재 (${formatCount(d.insertedCount)}건)`,
    ],
  },
  {
    key: 'step1_5',
    label: '스텝1.5',
    logMessages: (d) => [
      '데이터 처리: 지가르데(Zygarde) 10% 폼 스탯 보정 및 Level 50 최대 CP 계산 완료',
      `결과: pokedex_json 테이블 evolution·max_cp 컬럼 ${formatCount(d.updatedCount)}건 업데이트`,
    ],
  },
  {
    key: 'step1_6',
    label: '스텝1.6',
    logMessages: () => [
      '데이터 처리: 스텝1.6.sql 실행하여 폼 번호(dex_form_nr) 계산 완료',
      '결과: pokedex_json 테이블 dex_form_nr 컬럼 반영 완료',
    ],
  },
  {
    key: 'step2',
    label: '스텝2',
    logMessages: (d) => [
      d.status === 'LATEST'
        ? '원본 처리: pokemon_species.csv 최신 상태 확인, 기존 파일 재사용'
        : '원본 처리: pokemon_species.csv 신규 다운로드 및 파싱 완료',
      `결과: pokemon_species_csv 테이블 전체 교체 적재 (${formatCount(d.insertedCount)}건)`,
    ],
  },
  {
    key: 'step2_5',
    label: '스텝2.5',
    logMessages: (d) => [
      '데이터 처리: ID 916 예외 데이터 보정 후 base_no·evl(진화 단계) 계산 완료',
      `결과: pokemon_species_csv 테이블 base_no·evl 컬럼 ${formatCount(d.updatedCount)}건 업데이트`,
    ],
  },
  {
    key: 'step3',
    label: '스텝3',
    logMessages: (d) => [
      '데이터 처리: 기본형 포켓몬 필터링 후 최대 CP·도감번호 기준 정렬, 랭킹(rank_) 부여 완료',
      `결과: pokedex 테이블 이름·분류·rank_ ${formatCount(d.upsertedCount)}건 Upsert`,
    ],
  },
  {
    key: 'step3_1',
    label: '스텝3.1',
    logMessages: (d) => [
      '데이터 처리: base_no·evl·성비(gndr_rt) 매핑 완료',
      `결과: pokedex 테이블 base_no·evl·gndr_rt 컬럼 ${formatCount(d.updatedCount)}건 업데이트`,
    ],
  },
  {
    key: 'moveSets',
    label: '스텝4',
    logMessages: (d) => [
      d.status === 'LATEST'
        ? '원본 처리: CalcyDex(Calcy IV) 최신 상태 확인, 기존 데이터 재사용'
        : '원본 처리: CalcyDex(Calcy IV) 신규 릴리스 다운로드 및 갱신 완료',
      `데이터 처리: 상위 랭킹(rank 1~205) ${formatCount(d.pokemonCount)}마리 대상 무브셋 ${formatCount(d.combinationCount)}개 조합 계산 완료`,
      `결과: calcydex 테이블 전체 교체 적재 (${formatCount(d.insertedCount)}건)`,
    ],
  },
]

interface LogLine {
  id: number
  time: string
  type: 'info' | 'success' | 'error'
  message: string
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `[${h}:${m}:${s}]`
}

export default function PokedexPage() {
  const [checked, setChecked] = useState<Record<PokedexStepKey, boolean>>(
    () => Object.fromEntries(STEPS.map((s) => [s.key, true])) as Record<PokedexStepKey, boolean>,
  )
  const [logs, setLogs] = useState<LogLine[]>([])
  const [running, setRunning] = useState(false)
  const nextId = useRef(0)
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = '도감'
  }, [])

  const appendLog = (message: string, type: LogLine['type'] = 'info') => {
    setLogs((prev) => [...prev, { id: nextId.current++, time: formatTime(new Date()), type, message }])
    requestAnimationFrame(() => {
      const el = consoleRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  const clearLogs = () => {
    setLogs([])
    appendLog('로그가 초기화되었습니다.')
  }

  const runStep = async (step: StepDef) => {
    appendLog(`${step.label} 시작`, 'info')
    try {
      const body = await apiPostQuery<PokedexUpdateResponse>('/api/pogo/dex/update', { [step.key]: 'true' })
      const stepData = (body[step.key as keyof PokedexUpdateResponse] as PokedexStepResult) ?? {}
      step.logMessages(stepData).forEach((message) => appendLog(message, 'info'))
      appendLog(`${step.label} 정상 종료`, 'success')
    } catch (err) {
      appendLog(`오류: ${(err as Error).message}`, 'error')
      appendLog(`${step.label} 실패 종료`, 'error')
      throw err
    }
  }

  const startUpdate = async () => {
    const selected = STEPS.filter((s) => checked[s.key])
    if (selected.length === 0) {
      alert('실행할 스텝을 최소 하나 이상 선택해 주세요.')
      return
    }

    setRunning(true)
    appendLog('도감 업데이트 시작', 'info')
    try {
      for (const step of selected) {
        await runStep(step)
      }
      appendLog('도감 업데이트 종료', 'success')
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="toolbar-scope">
      <div className="toolbar">
        <a
          id="btnStart"
          className={`download${running ? ' disabled' : ''}`}
          onClick={() => !running && startUpdate()}
        >
          도감 업데이트
        </a>
        <div className="checkbox-group">
          {STEPS.map((step) => (
            <label className="checkbox-item" key={step.key}>
              <input
                type="checkbox"
                checked={checked[step.key]}
                disabled={running}
                onChange={(e) => setChecked((prev) => ({ ...prev, [step.key]: e.target.checked }))}
              />
              {step.label}
            </label>
          ))}
        </div>
        <span className="clear-btn" onClick={clearLogs}>
          로그 지우기
        </span>
      </div>

      <div className="pokedex-preview-wrap">
        <div id="logConsole" className="log-console" ref={consoleRef}>
          {logs.map((log) => (
            <div className={`log-entry log-${log.type}`} key={log.id}>
              <span className="log-time">{log.time}</span>
              {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
