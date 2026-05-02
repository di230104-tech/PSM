import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AssetStatusChart = ({ data }) => {
  const COLORS = {
    'In Use': '#10B981',
    'Available': '#F59E0B',
    'In Repair': '#EF4444',
    'Written-Off': '#6B7280',
    'Broken': '#DC2626',
    'Lost/Stolen': '#DC2626'
  };

  // --- NEW: Handle Empty State (Real Data Fix) ---
  if (!data || data.length === 0) {
    return (
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center h-96 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Assets by Status</h3>
            <div className="bg-muted/30 rounded-full p-6 mb-4">
                <span className="text-4xl">📊</span>
            </div>
            <p className="text-muted-foreground">No assets registered yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add an asset to see this chart.</p>
        </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0];
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-popover-foreground">{data?.name}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-medium text-foreground">{data?.value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {/* The 'total' prop comes correctly from our new index.jsx logic */}
            Percentage: <span className="font-medium text-foreground">{((data?.value / data?.payload?.total) * 100)?.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry?.color }}
            />
            <span className="text-sm text-foreground">{entry?.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Assets by Status</h3>
        <p className="text-sm text-muted-foreground">Current distribution of asset statuses</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS?.[entry?.name] || '#6B7280'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetStatusChart;