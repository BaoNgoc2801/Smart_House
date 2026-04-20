import { useEffect, useState } from 'react';
import { fetchElderlyDashboardData } from '../services/elderlyApi';
import type { DashboardData } from '../services/elderlyApi';
import { AlertCircle, Bed, Moon, Users, TrendingUp, Armchair, Footprints } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export function ElderlyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElderlyDashboardData('Patient A')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderChart = (
    chartData: any[],
    title: string,
    Icon: any,
    footerTitle: string
  ) => {
    return (
      <div className="flex flex-col border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
        {/* Chart Header */}
        <div className="bg-blue-600 text-white px-3 py-1.5 text-xs font-bold">
          {title}
        </div>
        
        {/* Chart Body */}
        <div className="p-2 h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10 }}
                axisLine={true}
                tickLine={false}
                interval={4}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-2 shadow-md rounded text-xs">
                        <p className="font-bold">Day {data.day}</p>
                        <p>Value: {Number(data.value).toFixed(2)}</p>
                        {data.isAnomaly && (
                          <p className="text-red-500 font-bold mt-1">Anomaly Detected!</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" maxBarSize={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isAnomaly ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold z-10 bg-white/60">
            Day
          </div>
        </div>
        
        {/* Chart Footer */}
        <div className="bg-blue-50/50 flex items-center justify-center gap-2 py-2 border-t border-slate-100">
          <Icon className="w-4 h-4 text-slate-800" />
          <span className="font-bold text-slate-800 text-sm">{footerTitle}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Top Navigation Banner */}
      <div className="bg-[#0078FF] text-white rounded-md shadow-md p-4 flex justify-between items-start">
        <div className="flex items-center gap-2 mt-2">
          <div className="bg-white/20 p-1.5 rounded">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Elderly Care Dashboard</h1>
        </div>
        
        <div className="flex flex-col gap-3 font-semibold text-sm">
          <div className="flex items-center gap-2 hover:text-blue-200 cursor-pointer transition-colors">
            <Users className="w-5 h-5" />
            <span>Patients</span>
          </div>
          <div className="flex items-center gap-2 hover:text-blue-200 cursor-pointer transition-colors">
            <AlertCircle className="w-5 h-5" />
            <span>Real-Time Anomalies</span>
          </div>
          <div className="flex items-center gap-2 hover:text-blue-200 cursor-pointer transition-colors">
            <TrendingUp className="w-5 h-5" />
            <span>Detailed Activity Monitoring</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-red-50 border border-red-100 rounded-md p-4">
            <div className="flex items-center gap-2 text-red-500 font-bold mb-4 text-lg">
              <AlertCircle className="w-5 h-5" />
              <h2>Real-Time Alerts</h2>
            </div>
            <div className="flex flex-col gap-4">
              {data.alerts.map((alert, idx) => (
                <div key={idx} className="flex gap-2 text-red-600 font-medium text-sm leading-relaxed">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{alert}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Charts */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-xl font-medium text-slate-800 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h2>Detailed Activity Monitoring</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderChart(data.sitting, "Sitting Duration", Armchair, "Sitting Duration")}
            {renderChart(data.walking, "Walking Duration", Footprints, "Walking Duration")}
            {renderChart(data.wakeup, "Wakeup Count", Bed, "Wakeup Count")}
            {renderChart(data.sleeping, "Sleeping Duration", Moon, "Sleeping Duration")}
          </div>
        </div>
      </div>

    </div>
  );
}
