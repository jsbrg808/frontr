import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import '../styles/layout.css'

const MENU_ITEMS = [
  { to: '/coin', label: '동전' },
  { to: '/pogo/5f', label: '포고 5f' },
  { to: '/pogo/5s', label: '포고 5s' },
  { to: '/pogo/5t', label: '포고 5t' },
  { to: '/pogo/5pc', label: '포고 5pc' },
  { to: '/pogo/5de', label: '포고 5de' },
  { to: '/pogo/5y', label: '포고 5y' },
  { to: '/pogo/dex', label: '포고 도감' },
]

export default function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="sidebar">
        <h2>메뉴</h2>
        <div className="sidebar-menu">
          {MENU_ITEMS.map((item) => (
            <div className="sidebar-item" key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {item.label}
              </NavLink>
            </div>
          ))}
        </div>
      </div>
      <div className="main-content">{children ?? <Outlet />}</div>
    </div>
  )
}
