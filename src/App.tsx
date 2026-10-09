import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CoinListPage from './pages/CoinListPage'
import Pogo5TablePage from './pages/Pogo5TablePage'
import Pogo5dePage from './pages/Pogo5dePage'
import PogoExcelPreviewPage from './pages/PogoExcelPreviewPage'
import PokedexPage from './pages/PokedexPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/coin" replace />} />
        <Route path="/coin" element={<CoinListPage />} />
        <Route path="/pogo/5de" element={<Pogo5dePage />} />
        <Route path="/pogo/5pc" element={<PogoExcelPreviewPage type="5pc" />} />
        <Route path="/pogo/5y" element={<PogoExcelPreviewPage type="5y" />} />
        <Route path="/pogo/dex" element={<PokedexPage />} />
        <Route path="/pogo/:tbl" element={<Pogo5TablePage />} />
      </Route>
    </Routes>
  )
}
