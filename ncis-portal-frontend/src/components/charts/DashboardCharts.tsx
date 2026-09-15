import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  MONTHLY_REVENUE_DATA,
  CORRIDOR_TRANSIT_TIME_DATA,
  PORT_CONGESTION_DATA,
  CUSTOMS_CHANNEL_DATA,
} from '../../services/chartData';

export const RevenueTrendChart: React.FC<{ title?: string; height?: number }> = ({
  title = 'Monthly Customs Revenue Realization (Million ETB)',
  height = 240
}) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          {title}
        </h4>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium">
          +18.4% MoM
        </span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="totalRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#totalRevenueGrad)"
              name="Total Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CorridorTransitChart: React.FC<{ height?: number }> = ({ height = 240 }) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Corridor Route Dwell Times (Hours)
        </h4>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          Galafi Bottleneck Tracked
        </span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CORRIDOR_TRANSIT_TIME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
            <XAxis dataKey="segment" tick={{ fontSize: 9 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="hours" fill="#f59e0b" name="Actual Hours" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" fill="#10b981" name="SLA Target" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PortCongestionBarChart: React.FC<{ height?: number }> = ({ height = 240 }) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Terminal Yard Occupancy (%)
        </h4>
        <span className="text-[11px] font-mono text-slate-500">Live Telemetry</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={PORT_CONGESTION_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis dataKey="port" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Bar dataKey="occupancy" fill="#082849" name="Yard Capacity %" radius={[0, 4, 4, 0]}>
              {PORT_CONGESTION_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.occupancy > 85 ? '#f43f5e' : entry.occupancy > 60 ? '#f59e0b' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CustomsChannelDonutChart: React.FC<{ height?: number }> = ({ height = 240 }) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Customs Risk Assessment Channels
        </h4>
        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">68% Green</span>
      </div>
      <div style={{ height }} className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={CUSTOMS_CHANNEL_DATA}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {CUSTOMS_CHANNEL_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
