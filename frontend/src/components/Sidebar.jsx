import {
  LayoutDashboard, UserPlus, Search, Droplets,
  AlertTriangle, Clock, BarChart2, HeartPulse, LogOut, CircleUser,
} from 'lucide-react'

const NAV = [
  { label: 'Overview',      icon: LayoutDashboard },
  { label: 'Donors',        icon: UserPlus },
  { label: 'Donor Search',  icon: Search },
  { label: 'Inventory',     icon: Droplets },
  { label: 'Emergency',     icon: AlertTriangle },
  { label: 'History',       icon: Clock },
  { label: 'Analytics',     icon: BarChart2 },
]

const s = {
  sidebar: {
    width: 'var(--sidebar-w)',
    minWidth: 'var(--sidebar-w)',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '22px 20px 18px',
    borderBottom: '1px solid var(--border)',
  },
  logoIcon: {
    width: 34,
    height: 34,
    background: 'linear-gradient(135deg, #e53e3e, #c53030)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e2e8f0',
    lineHeight: 1.2,
  },
  logoSub: { fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginTop: 2 },
  section: { padding: '18px 12px 6px' },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--muted)',
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    padding: '0 8px',
    marginBottom: 6,
  },
  item: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 2,
    background: active ? 'rgba(229,62,62,0.15)' : 'transparent',
    color: active ? '#fc8181' : 'var(--muted)',
    fontWeight: active ? 600 : 400,
    fontSize: 13.5,
    transition: 'all .15s',
    userSelect: 'none',
  }),
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid var(--border)',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
  },
  footerNote: {
    padding: '10px 16px',
    fontSize: 11,
    color: 'var(--muted)',
    textAlign: 'center',
  },
}

export default function Sidebar({ current, onNavigate, username, onLogout }) {
  return (
    <nav style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoIcon}>
          <HeartPulse size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={s.logoText}>BloodBank</div>
          <div style={s.logoSub}>Management System</div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionLabel}>Navigation</div>
        {NAV.map(({ label, icon: Icon }) => (
          <div
            key={label}
            style={s.item(current === label)}
            onClick={() => onNavigate(label)}
            onMouseEnter={e => {
              if (current !== label) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = '#e2e8f0'
              }
            }}
            onMouseLeave={e => {
              if (current !== label) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--muted)'
              }
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </div>
        ))}
      </div>

      <div style={s.footer}>
        {username && (
          <div style={s.userRow}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(229,62,62,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CircleUser size={16} color="#fc8181" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#eceff1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Logged in</p>
            </div>
            <button onClick={onLogout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,129,129,.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={14} color="var(--muted)" />
            </button>
          </div>
        )}
        <div style={s.footerNote}>SIC Hackathon 2026</div>
      </div>
    </nav>
  )
}
