import { useEffect, useState } from 'react'
import { Clock, Search } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import PageHeader from '../components/PageHeader'
import { api } from '../api'

const label = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }

export default function History() {
  const [records, setRecords]    = useState([])
  const [form, setForm]          = useState({ donor_id: '', units_donated: 1, recipient_details: '', donation_date: new Date().toISOString().split('T')[0] })
  const [lookupId, setLookupId]  = useState('')
  const [lookupRes, setLookupRes]= useState(null)
  const [msg, setMsg]            = useState(null)
  const [n, setN]                = useState(20)

  const load = () => api.history(n).then(setRecords)
  useEffect(() => { load() }, [n])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.recordDonation({ ...form, units_donated: Number(form.units_donated) })
      setMsg({ ok: true, text: 'Donation recorded.' })
      setForm({ donor_id: '', units_donated: 1, recipient_details: '', donation_date: new Date().toISOString().split('T')[0] })
      load()
    } catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  const lookup = async () => {
    if (!lookupId.trim()) return
    try { setLookupRes(await api.donorHistory(lookupId.trim())) }
    catch { setLookupRes([]) }
  }

  return (
    <div>
      <PageHeader title="Donation History" subtitle="Record and review blood donation activity" />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Record Donation</p>
            <form onSubmit={submit}>
              <div style={{ marginBottom: 14 }}>
                <label style={label}>Donor ID</label>
                <input value={form.donor_id} onChange={e => set('donor_id', e.target.value)} placeholder="8-char donor ID" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Units</label>
                  <input type="number" min={1} value={form.units_donated} onChange={e => set('units_donated', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label}>Date</label>
                  <input type="date" value={form.donation_date} onChange={e => set('donation_date', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={label}>Recipient Details</label>
                <input value={form.recipient_details} onChange={e => set('recipient_details', e.target.value)} placeholder="Name / ward" />
              </div>
              {msg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                  background: msg.ok ? 'rgba(72,187,120,.12)' : 'rgba(252,129,129,.12)',
                  color: msg.ok ? '#68d391' : '#fc8181',
                  border: `1px solid ${msg.ok ? 'rgba(72,187,120,.25)' : 'rgba(252,129,129,.25)'}`,
                }}>
                  {msg.text}
                </div>
              )}
              <button type="submit" style={{ width: '100%', padding: 10, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Record Donation
              </button>
            </form>
          </Card>

          <Card>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Donor Lookup</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={lookupId} onChange={e => setLookupId(e.target.value)} placeholder="Donor ID" onKeyDown={e => e.key === 'Enter' && lookup()} />
              <button onClick={lookup} style={{ padding: '9px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer', flexShrink: 0 }}>
                <Search size={14} />
              </button>
            </div>
            {lookupRes !== null && (
              <div style={{ marginTop: 12 }}>
                {lookupRes.length === 0
                  ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>No records found.</p>
                  : lookupRes.slice(0, 5).map(r => (
                    <div key={r.record_id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>{r.donation_date}</span>
                        <Badge variant="blue">{r.units_donated} u</Badge>
                      </div>
                      <p style={{ color: 'var(--muted)', marginTop: 3 }}>{r.recipient_details}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </Card>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={14} color="var(--muted)" /> Recent Donations
            </p>
            <select value={n} onChange={e => setN(Number(e.target.value))} style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}>
              {[10, 20, 50, 100].map(v => <option key={v} value={v}>Last {v}</option>)}
            </select>
          </div>
          <table>
            <thead>
              <tr><th>Date</th><th>Donor ID</th><th>Units</th><th>Recipient</th></tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.record_id}>
                  <td style={{ color: 'var(--muted)' }}>{r.donation_date}</td>
                  <td><code style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>{r.donor_id.slice(0, 8)}</code></td>
                  <td><Badge variant="blue">{r.units_donated} u</Badge></td>
                  <td style={{ color: 'var(--muted)' }}>{r.recipient_details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
