import { useEffect, useState } from 'react'
import { Users, UserCheck, Droplets, AlertTriangle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { api } from '../api'

const BG_COLORS = {
  'A+': '#e53e3e', 'A-': '#fc8181', 'B+': '#ed8936', 'B-': '#f6ad55',
  'AB+': '#48bb78', 'AB-': '#68d391', 'O+': '#4299e1', 'O-': '#63b3ed',
}

export default function Overview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.overview().then(setData).catch(e => setError(e.message))
  }, [])

  if (error) return (
    <div style={{ padding: 40, color: '#fc8181', textAlign: 'center' }}>
      <p style={{ fontSize: 16, marginBottom: 8 }}>Could not connect to API</p>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>Start the backend: <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>python -m uvicorn api:app --reload</code></p>
    </div>
  )

  if (!data) return <Loading />

  const monthlyData = Object.entries(data.monthly_summary || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, units]) => ({ month: month.slice(5), units }))

  const bgData = Object.entries(data.blood_group_distribution || {})
    .map(([name, value]) => ({ name, value }))

  return (
    <div style={{ width: '100%' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2744 0%, #1e3a5f 100%)',
        border: '1px solid #2d4a6e',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: 13, color: '#90cdf4', marginBottom: 6, fontWeight: 500 }}>Blood Donation Management</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
            Welcome back, Rahul
          </h2>
          <p style={{ fontSize: 13.5, color: '#90cdf4', maxWidth: 380, lineHeight: 1.6 }}>
            {data.eligible_donors} donors are eligible to donate today.
            {data.emergency_queue > 0
              ? ` ${data.emergency_queue} emergency request(s) pending action.`
              : ' No pending emergency requests.'}
          </p>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Droplets size={36} color="#63b3ed" strokeWidth={1.5} />
          </div>
          <span style={{
            background: 'rgba(99,179,237,.15)', color: '#63b3ed',
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            {data.total_units} units available
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Donors"          value={data.total_donors}    icon={Users}         color="#4299e1" />
        <StatCard label="Eligible to Donate"    value={data.eligible_donors} icon={UserCheck}     color="#48bb78" />
        <StatCard label="Blood Units Available" value={data.total_units}     icon={Droplets}      color="#ed8936" />
        <StatCard label="Emergency Queue"       value={data.emergency_queue} icon={AlertTriangle} color={data.emergency_queue > 0 ? '#e53e3e' : '#48bb78'} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Monthly Donations</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Units donated per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff', fontWeight: 600 }} itemStyle={{ color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="units" stroke="#e53e3e" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Blood Group Distribution</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Donors by blood group</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={bgData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={42} paddingAngle={3}>
                {bgData.map((entry) => (
                  <Cell key={entry.name} fill={BG_COLORS[entry.name] || '#8892a4'} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff', fontWeight: 600 }} itemStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent donations table */}
      <Card>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Donations</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Donor ID</th>
              <th>Units</th>
              <th>Recipient</th>
            </tr>
          </thead>
          <tbody>
            {(data.recent_donations || []).map(r => (
              <tr key={r.record_id}>
                <td>{r.donation_date}</td>
                <td><code style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>{r.donor_id.slice(0, 8)}</code></td>
                <td><Badge variant="blue">{r.units_donated} u</Badge></td>
                <td style={{ color: 'var(--muted)' }}>{r.recipient_details || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <Droplets size={40} strokeWidth={1} style={{ marginBottom: 12 }} />
        <p>Loading...</p>
      </div>
    </div>
  )
}
