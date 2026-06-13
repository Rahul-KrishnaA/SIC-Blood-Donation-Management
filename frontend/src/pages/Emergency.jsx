import { useEffect, useState } from 'react'
import { AlertTriangle, Play } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import PageHeader from '../components/PageHeader'
import { api } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const label = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }

const PRIORITY_LABELS = { 1: 'Critical', 2: 'Urgent', 3: 'Normal' }
const PRIORITY_VARIANT = { 1: 'red', 2: 'yellow', 3: 'green' }

export default function Emergency() {
  const [queue, setQueue]   = useState([])
  const [form, setForm]     = useState({ blood_group: 'A+', units_needed: 2, hospital: '', contact: '', priority: 2 })
  const [msg, setMsg]       = useState(null)
  const [loading, setLoad]  = useState(false)

  const load = () => api.emergency().then(setQueue)
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.hospital.trim() || !form.contact.trim()) { setMsg({ ok: false, text: 'Hospital and contact required.' }); return }
    try {
      await api.submitEmergency({ ...form, units_needed: Number(form.units_needed), priority: Number(form.priority) })
      setMsg({ ok: true, text: 'Request submitted to queue.' })
      setForm({ blood_group: 'A+', units_needed: 2, hospital: '', contact: '', priority: 2 })
      load()
    } catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  const processNext = async () => {
    setLoad(true)
    try {
      const result = await api.processEmergency()
      setMsg({ ok: result.fulfilled, text: result.fulfilled
        ? `Fulfilled: ${result.hospital} received ${result.blood_group} units.`
        : `Insufficient stock for ${result.hospital} (${result.blood_group}).`
      })
      load()
    } catch (err) { setMsg({ ok: false, text: err.message }) }
    setLoad(false)
  }

  return (
    <div>
      <PageHeader
        title="Emergency Requests"
        subtitle="Submit and manage urgent blood requests"
        action={
          <button onClick={processNext} disabled={loading || queue.length === 0} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', background: queue.length > 0 ? '#e53e3e' : 'var(--surface2)',
            color: queue.length > 0 ? '#fff' : 'var(--muted)',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13,
            cursor: queue.length === 0 || loading ? 'default' : 'pointer',
          }}>
            <Play size={14} />
            Process Next ({queue.length})
          </button>
        }
      />

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13,
          background: msg.ok ? 'rgba(72,187,120,.12)' : 'rgba(252,129,129,.12)',
          color: msg.ok ? '#68d391' : '#fc8181',
          border: `1px solid ${msg.ok ? 'rgba(72,187,120,.25)' : 'rgba(252,129,129,.25)'}`,
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        <Card>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={15} color="#ed8936" /> Submit Request
          </p>
          <form onSubmit={submit}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Blood Group</label>
                <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Units Needed</label>
                <input type="number" min={1} value={form.units_needed} onChange={e => set('units_needed', e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Hospital Name</label>
              <input value={form.hospital} onChange={e => set('hospital', e.target.value)} placeholder="e.g. Apollo Hospital" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Contact Number</label>
              <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="+91 9999999999" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={label}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', Number(e.target.value))}>
                <option value={1}>1 — Critical</option>
                <option value={2}>2 — Urgent</option>
                <option value={3}>3 — Normal</option>
              </select>
            </div>
            <button type="submit" style={{ width: '100%', padding: 10, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Submit Request
            </button>
          </form>
        </Card>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Pending Queue</p>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{queue.length} requests</span>
          </div>
          {queue.length === 0
            ? <p style={{ padding: 24, color: 'var(--muted)', fontSize: 13 }}>Queue is empty.</p>
            : (
              <table>
                <thead>
                  <tr><th>Priority</th><th>Blood Group</th><th>Units</th><th>Hospital</th><th>Contact</th></tr>
                </thead>
                <tbody>
                  {queue.map(r => (
                    <tr key={r.request_id}>
                      <td><Badge variant={PRIORITY_VARIANT[r.priority]}>{PRIORITY_LABELS[r.priority]}</Badge></td>
                      <td><Badge variant="red">{r.blood_group}</Badge></td>
                      <td style={{ color: 'var(--muted)' }}>{r.units_needed}</td>
                      <td style={{ fontWeight: 500 }}>{r.hospital}</td>
                      <td style={{ color: 'var(--muted)' }}>{r.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      </div>
    </div>
  )
}
