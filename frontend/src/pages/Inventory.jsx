import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Card from '../components/Card'
import Badge from '../components/Badge'
import PageHeader from '../components/PageHeader'
import { api } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const label = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }

export default function Inventory() {
  const [items, setItems] = useState([])
  const [form, setForm]   = useState({ blood_group: 'A+', units: 10, expiry_date: '' })
  const [msg, setMsg]     = useState(null)

  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1)
  const defaultExpiry = nextYear.toISOString().split('T')[0]

  const load = () => api.inventory().then(setItems)
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.addInventory({ ...form, units: Number(form.units), expiry_date: form.expiry_date || defaultExpiry })
      setMsg({ ok: true, text: 'Inventory updated.' })
      load()
    } catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  const chartData = items.map(i => ({
    name: i.blood_group, units: i.available_units, expired: i.expired,
  }))

  return (
    <div>
      <PageHeader title="Blood Inventory" subtitle="Track and manage available blood units" />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add Units</p>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Blood Group</label>
              <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Units to Add</label>
              <input type="number" min={1} value={form.units} onChange={e => set('units', e.target.value)} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={label}>Expiry Date</label>
              <input type="date" value={form.expiry_date || defaultExpiry} onChange={e => set('expiry_date', e.target.value)} />
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
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Add Units
            </button>
          </form>
        </Card>

        <Card>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Units by Blood Group</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Green = valid, Red = expired</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={56} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
              <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={{ stroke: '#3d4a5a' }} tickLine={{ stroke: '#3d4a5a' }} label={{ value: 'Blood Group', position: 'insideBottom', offset: -10, fill: '#8892a4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={{ stroke: '#3d4a5a' }} tickLine={{ stroke: '#3d4a5a' }} width={52} label={{ value: 'Units Available', angle: -90, position: 'insideLeft', offset: 12, fill: '#8892a4', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff', fontWeight: 600 }} itemStyle={{ color: '#e2e8f0' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.expired ? '#e53e3e' : '#48bb78'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Full Inventory</p>
        </div>
        <table>
          <thead>
            <tr><th>Blood Group</th><th>Available Units</th><th>Expiry Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.sort((a, b) => a.blood_group.localeCompare(b.blood_group)).map(item => (
              <tr key={item.blood_group}>
                <td><strong>{item.blood_group}</strong></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, maxWidth: 160, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(item.available_units / 100 * 100, 100)}%`, height: '100%', background: item.expired ? '#e53e3e' : '#48bb78', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.available_units}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--muted)' }}>{item.expiry_date}</td>
                <td>
                  <Badge variant={item.expired ? 'red' : item.available_units < 10 ? 'yellow' : 'green'}>
                    {item.expired ? 'Expired' : item.available_units < 10 ? 'Low Stock' : 'OK'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
