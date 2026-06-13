import { useState } from 'react'
import { Search } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import PageHeader from '../components/PageHeader'
import { api } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const label = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }

export default function DonorSearch() {
  const [mode, setMode]       = useState('blood_group')
  const [bg, setBg]           = useState('A+')
  const [city, setCity]       = useState('')
  const [eligBg, setEligBg]   = useState('All')
  const [results, setResults] = useState(null)
  const [searching, setSrch]  = useState(false)

  const search = async () => {
    setSrch(true)
    try {
      let params = {}
      if (mode === 'blood_group')  params = { blood_group: bg }
      else if (mode === 'city')    params = { city }
      else                         params = { eligible_only: true, ...(eligBg !== 'All' ? { blood_group: eligBg } : {}) }
      setResults(await api.searchDonors(params))
    } catch (e) { setResults([]) }
    setSrch(false)
  }

  const TAB = (id, label) => (
    <button onClick={() => { setMode(id); setResults(null) }} style={{
      padding: '8px 16px', fontSize: 13, fontWeight: mode === id ? 600 : 400,
      background: mode === id ? 'rgba(229,62,62,.15)' : 'transparent',
      color: mode === id ? '#fc8181' : 'var(--muted)',
      border: `1px solid ${mode === id ? 'rgba(229,62,62,.3)' : 'var(--border)'}`,
      borderRadius: 8, cursor: 'pointer',
    }}>{label}</button>
  )

  return (
    <div>
      <PageHeader title="Donor Search" subtitle="Find donors by blood group, city, or eligibility" />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {TAB('blood_group', 'By Blood Group')}
          {TAB('city', 'By City')}
          {TAB('eligible', 'Eligible Donors')}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          {mode === 'blood_group' && (
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label style={label}>Blood Group</label>
              <select value={bg} onChange={e => setBg(e.target.value)}>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          )}
          {mode === 'city' && (
            <div style={{ flex: 1, maxWidth: 300 }}>
              <label style={label}>City Name</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Chennai" onKeyDown={e => e.key === 'Enter' && search()} />
            </div>
          )}
          {mode === 'eligible' && (
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label style={label}>Blood Group (optional)</label>
              <select value={eligBg} onChange={e => setEligBg(e.target.value)}>
                <option>All</option>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          )}
          <button onClick={search} disabled={searching} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', background: '#e53e3e', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13,
            cursor: searching ? 'default' : 'pointer', opacity: searching ? .7 : 1,
            height: 38,
          }}>
            <Search size={14} />
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </Card>

      {results !== null && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{results.length} result(s)</span>
          </div>
          {results.length === 0
            ? <p style={{ padding: 24, color: 'var(--muted)', fontSize: 13 }}>No donors found.</p>
            : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Age</th><th>Blood</th><th>City</th><th>Last Donation</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(d => (
                    <tr key={d.donor_id}>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td style={{ color: 'var(--muted)' }}>{d.age}</td>
                      <td><Badge variant="red">{d.blood_group}</Badge></td>
                      <td style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{d.city}</td>
                      <td style={{ color: 'var(--muted)' }}>{d.last_donation_date || '—'}</td>
                      <td><Badge variant={d.eligible ? 'green' : 'grey'}>{d.eligible ? 'Eligible' : 'Ineligible'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      )}
    </div>
  )
}
