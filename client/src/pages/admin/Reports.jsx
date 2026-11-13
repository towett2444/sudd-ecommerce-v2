import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Btn, Card, inputClass, PageHeader, Stat, TableWrap, Td, Th } from '../../components/admin/ui';
import { errorMessage, ksh, ORDER_STATUS, PAYMENT_METHOD } from '../../lib/format';
import { adminSalesReport } from '../../services/shop.service';

const today = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() + 3 * 3600 * 1000 - n * 864e5).toISOString().slice(0, 10);

const PRESETS = [
  ['7 days', () => [daysAgo(6), today(), 'day']],
  ['30 days', () => [daysAgo(29), today(), 'day']],
  ['90 days', () => [daysAgo(89), today(), 'week']],
  ['This year', () => [`${today().slice(0, 4)}-01-01`, today(), 'month']],
];

const Reports = () => {
  const [range, setRange] = useState({ from: daysAgo(29), to: today(), groupBy: 'day' });
  const [data, setData] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    setData(null);
    adminSalesReport(range).then(setData).catch((e) => toast.error(errorMessage(e, 'Could not load the report.')));
  }, [range]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Period', 'Orders', 'Revenue (paid)', 'Order value (incl. unpaid)'], ...data.series.map((r) => [r.period, r.orders, r.revenue, r.gross])];
    const csv = rows.map((r) => r.join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `sales-${data.from}-to-${data.to}.csv`;
    a.click();
  };

  const s = data?.summary;

  return (
    <div>
      <PageHeader title="Sales & revenue" text="Revenue counts paid orders. Dates are in Kenyan time.">
        <Btn variant="light" onClick={exportCsv} disabled={!data}>Export CSV</Btn>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        {PRESETS.map(([label, fn]) => {
          const [from, to, groupBy] = fn();
          const active = range.from === from && range.to === to;
          return (
            <button key={label} type="button" onClick={() => setRange({ from, to, groupBy })}
              className={`h-10 cursor-pointer border px-3 text-sm ${active ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
              {label}
            </button>
          );
        })}
        <input type="date" value={range.from} max={range.to} onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))} className={`${inputClass} !w-auto`} aria-label="From" />
        <input type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))} className={`${inputClass} !w-auto`} aria-label="To" />
        <select value={range.groupBy} onChange={(e) => setRange((r) => ({ ...r, groupBy: e.target.value }))} className={`${inputClass} !w-auto`} aria-label="Group by">
          <option value="day">By day</option><option value="week">By week</option><option value="month">By month</option>
        </select>
      </div>

      {!data ? <p className="text-sm text-gray-500">Loading…</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Revenue (paid)" value={ksh(s.revenue)} hint={`${s.paidOrders} paid orders`} />
            <Stat label="Orders" value={s.orders} hint={`${s.cancelled} cancelled · ${s.items} items sold`} />
            <Stat label="Average order" value={ksh(s.averageOrder)} hint={`${s.customers} customers ordered`} />
            <Stat label="Awaiting payment" value={ksh(s.unpaid)} hint={`${s.newCustomers} new sign-ups`} />
          </div>

          <Card title={`Revenue by ${data.groupBy}`} className="mt-6"
            action={<button type="button" onClick={() => setShowTable((v) => !v)} className="cursor-pointer text-xs text-gray-500 underline">{showTable ? 'Show chart' : 'Show table'}</button>}>
            {showTable ? (
              <TableWrap>
                <thead><tr><Th>Period</Th><Th>Orders</Th><Th>Revenue (paid)</Th><Th>Order value</Th></tr></thead>
                <tbody>{data.series.map((r) => <tr key={r.period}><Td>{r.period}</Td><Td>{r.orders}</Td><Td>{ksh(r.revenue)}</Td><Td>{ksh(r.gross)}</Td></tr>)}</tbody>
              </TableWrap>
            ) : <RevenueChart series={data.series} />}
          </Card>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card title="Top products">
              <TableWrap>
                <thead><tr><Th>Product</Th><Th>Units</Th><Th>Revenue</Th></tr></thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <Td><div className="flex items-center gap-3"><img src={p.image} alt="" className="h-10 w-9 bg-gray-100 object-cover" />{p.name}</div></Td>
                      <Td>{p.units}</Td><Td className="font-medium">{ksh(p.revenue)}</Td>
                    </tr>
                  ))}
                  {!data.topProducts.length && <tr><Td className="py-8 text-center text-gray-500">No paid sales in this period.</Td></tr>}
                </tbody>
              </TableWrap>
            </Card>

            <div className="space-y-6">
              <Card title="Payment methods">
                <ShareList rows={data.byMethod.map((m) => ({ label: PAYMENT_METHOD[m.method] || m.method, value: m.revenue, extra: `${m.orders} orders` }))} />
              </Card>
              <Card title="Sales by category">
                <ShareList rows={data.byCategory.map((c) => ({ label: c.category, value: c.revenue, extra: `${c.units} units` }))} />
              </Card>
            </div>

            <Card title="Top counties">
              <ShareList rows={data.byCounty.map((c) => ({ label: c.county, value: c.revenue, extra: `${c.orders} orders` }))} />
            </Card>

            <Card title="Orders by status">
              <TableWrap>
                <thead><tr><Th>Status</Th><Th>Orders</Th><Th>Value</Th></tr></thead>
                <tbody>
                  {Object.keys(ORDER_STATUS).map((k) => (
                    <tr key={k}><Td>{ORDER_STATUS[k].label}</Td><Td>{data.byStatus[k]?.orders || 0}</Td><Td>{ksh(data.byStatus[k]?.value || 0)}</Td></tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// Horizontal share bars: one neutral hue, value as text next to each bar.
const ShareList = ({ rows }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="px-5 py-8 text-center text-sm text-gray-500">No data in this period.</p>;
  return (
    <ul className="space-y-3 p-5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-800">{r.label}</span>
            <span className="text-gray-500">{r.extra} · <b className="text-gray-900">{ksh(r.value)}</b></span>
          </div>
          <div className="mt-1.5 h-2 bg-gray-100">
            <div className="h-full rounded-r-[4px] bg-gray-800" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

// Column with 4px rounded top corners, anchored to the baseline.
const barPath = (x, y, w, base, r) =>
  `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`;

// Single-series column chart of paid revenue with a hover tooltip.
const RevenueChart = ({ series }) => {
  const [hover, setHover] = useState(null);
  const W = 900;
  const H = 260;
  const pad = { l: 56, r: 12, t: 16, b: 28 };
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const nice = (() => {
    const p = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / p) * p;
  })();
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = innerW / Math.max(1, series.length);
  const barW = Math.max(2, Math.min(28, step - 2));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * nice);
  const labelEvery = Math.ceil(series.length / 10);
  const short = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(v));

  return (
    <div className="relative p-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Revenue per period (paid orders). Use 'Show table' for exact values.">
        {ticks.map((t) => {
          const y = pad.t + innerH - (t / nice) * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#eef0f3" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{short(t)}</text>
            </g>
          );
        })}
        {series.map((d, i) => {
          const h = (d.revenue / nice) * innerH;
          const x = pad.l + i * step + (step - barW) / 2;
          const y = pad.t + innerH - h;
          return (
            <g key={d.period} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * step} y={pad.t} width={step} height={innerH} fill="transparent" />
              {h > 0 && (
                <path d={barPath(x, y, barW, pad.t + innerH, Math.min(4, h, barW / 2))} fill={hover === i ? '#111827' : '#374151'} />
              )}
              {i % labelEvery === 0 && (
                <text x={pad.l + i * step + step / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#9ca3af">
                  {d.period.length === 10 ? d.period.slice(5) : d.period}
                </text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="#d1d5db" />
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-3 border border-gray-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{ left: `${Math.min(80, ((pad.l + hover * step) / W) * 100)}%` }}>
          <p className="font-medium text-gray-900">{series[hover].period}</p>
          <p className="text-gray-600">Revenue: <b>{ksh(series[hover].revenue)}</b></p>
          <p className="text-gray-500">{series[hover].orders} order(s)</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
