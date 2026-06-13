import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import { api } from '../api'

const BG_COLORS = {
  'A+': '#e53e3e', 'A-': '#fc8181', 'B+': '#ed8936', 'B-': '#f6ad55',
  'AB+': '#48bb78', 'AB-': '#68d391', 'O+': '#4299e1', 'O-': '#63b3ed',
}

const tooltipStyle = {
  contentStyle: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#fff', fontWeight: 600 },
  itemStyle: { color: '#e2e8f0' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

export default function Analytics() {
  const [overview, setOverview]     = useState(null)
  const [inventory, setInventory]   = useState([])

  useEffect(() => {
    api.overview().then(setOverview)
    api.inventory().then(setInventory)
  }, [])

  if (!overview) return <div style={{ color: 'var(--muted)', padding: 40 }}>Loading analytics...</div>

  const monthlyData = Object.entries(overview.monthly_summary || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, units]) => ({ month: month.slice(0, 7), units }))

  const bgData = Object.entries(overview.blood_group_distribution || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const invData = inventory.map(i => ({
    name: i.blood_group, units: i.available_units, status: i.expired ? 'Expired' : 'Valid',
  }))

  const totalDonors   = overview.total_donors
  const eligiblePct   = totalDonors > 0 ? Math.round(overview.eligible_donors / totalDonors * 100) : 0
  const totalUnits    = overview.total_units

  return (
    <div>
      <PageHeader title="Analytics" subtitle="System-wide blood donation insights" />

      {/* Summary KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Donors',       value: totalDonors,   color: '#4299e1' },
          { label: 'Eligibility Rate',   value: `${eligiblePct}%`, color: '#48bb78' },
          { label: 'Units in Stock',     value: totalUnits,    color: '#ed8936' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly trend + blood group donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Monthly Donation Trend</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Units donated over time</p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e53e3e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={{ stroke: '#3d4a5a' }} tickLine={{ stroke: '#3d4a5a' }} label={{ value: 'Month', position: 'insideBottom', offset: -10, fill: '#8892a4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={{ stroke: '#3d4a5a' }} tickLine={{ stroke: '#3d4a5a' }} width={52} label={{ value: 'Units Donated', angle: -90, position: 'insideLeft', offset: 12, fill: '#8892a4', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="units" stroke="#e53e3e" strokeWidth={2} fill="url(#mg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Donor Blood Group Mix</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Distribution across {totalDonors} donors</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={bgData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={48} paddingAngle={3}>
                {bgData.map(entry => (
                  <Cell key={entry.name} fill={BG_COLORS[entry.name] || '#8892a4'} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }} />
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Inventory bar + table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inventory Status</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Available units per blood group</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={invData} barSize={56} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
              <XAxis dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={{ stroke: '#3d4a5a' }} tickLine={{ stroke: '#3d4a5a' }} label={{ value: 'Blood Group', position: 'insideBottom', offset: -10, fill: '#8892a4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} axisLine={{ stroke: '#3d4a5a' }} tickLine={{ stroke: '#3d4a5a' }} width={52} label={{ value: 'Units Available', angle: -90, position: 'insideLeft', offset: 12, fill: '#8892a4', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                {invData.map((entry, i) => (
                  <Cell key={i} fill={entry.status === 'Expired' ? '#e53e3e' : '#48bb78'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Donor Count by Blood Group</p>
          </div>
          <table>
            <thead>
              <tr><th>Blood Group</th><th>Donors</th><th>Share</th></tr>
            </thead>
            <tbody>
              {bgData.map(({ name, value }) => (
                <tr key={name}>
                  <td style={{ fontWeight: 600, color: BG_COLORS[name] || 'var(--text)' }}>{name}</td>
                  <td style={{ color: 'var(--text)' }}>{value}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3 }}>
                        <div style={{ width: `${Math.round(value / totalDonors * 100)}%`, height: '100%', background: BG_COLORS[name] || '#8892a4', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{Math.round(value / totalDonors * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
