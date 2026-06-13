import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import Donors from './pages/Donors'
import DonorSearch from './pages/DonorSearch'
import Inventory from './pages/Inventory'
import Emergency from './pages/Emergency'
import History from './pages/History'
import Analytics from './pages/Analytics'
import LoginPage from './pages/Login'
import { seedUsers, getSession, logout } from './auth'

seedUsers()

const PAGES = {
  Overview,
  Donors,
  'Donor Search': DonorSearch,
  Inventory,
  Emergency,
  History,
  Analytics,
}

export default function App() {
  const [session, setSession] = useState(() => getSession())
  const [page, setPage]       = useState('Overview')

  const handleAuth = (username) => setSession({ username })

  const handleLogout = () => {
    logout()
    setSession(null)
    setPage('Overview')
  }

  if (!session) return <LoginPage onAuth={handleAuth} />

  const Page = PAGES[page] || Overview

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar current={page} onNavigate={setPage} username={session.username} onLogout={handleLogout} />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
        <Page username={session.username} />
      </main>
    </div>
  )
}
