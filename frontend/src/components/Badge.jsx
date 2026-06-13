const COLORS = {
  green:  { bg: 'rgba(72,187,120,.15)', color: '#68d391' },
  red:    { bg: 'rgba(252,129,129,.15)', color: '#fc8181' },
  yellow: { bg: 'rgba(237,137,54,.15)', color: '#f6ad55' },
  blue:   { bg: 'rgba(99,179,237,.15)', color: '#63b3ed' },
  grey:   { bg: 'rgba(160,174,192,.12)', color: '#a0aec0' },
}

export default function Badge({ children, variant = 'grey' }) {
  const { bg, color } = COLORS[variant] || COLORS.grey
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
