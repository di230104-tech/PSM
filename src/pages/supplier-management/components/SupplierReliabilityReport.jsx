import React, { useMemo } from 'react';

export default function SupplierReliabilityReport({ assets = [] }) {
  const supplierStats = useMemo(() => {
    if (!assets || assets.length === 0) return [];

    const statsMap = {};

    assets.forEach(asset => {
      // Use supplier name from relation, fallback to asset.manufacturer or 'Unknown'
      const supplier = asset?.suppliers?.company_name || asset?.manufacturer || 'Unknown Supplier';

      if (!statsMap[supplier]) {
        statsMap[supplier] = { name: supplier, total: 0, broken: 0 };
      }

      statsMap[supplier].total += 1;

      // Count if the asset is currently broken or under repair
      const status = String(asset?.status || '').toLowerCase().trim();
      if (status === 'broken' || status === 'in repair') {
        statsMap[supplier].broken += 1;
      }
    });

    // Calculate percentage and convert to array
    return Object.values(statsMap)
      .map(stat => ({
        ...stat,
        failureRate: stat.total > 0 ? ((stat.broken / stat.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => parseFloat(b.failureRate) - parseFloat(a.failureRate)); // Sort worst to best
  }, [assets]);

  const getFailureRateColor = (failureRate, total) => {
    const rate = parseFloat(failureRate);
    if (rate === 0) return 'text-green-600';
    if (rate > 15 && total > 5) return 'text-red-600';
    return 'text-gray-700';
  };

  const getProgressBarColor = (failureRate, total) => {
    const rate = parseFloat(failureRate);
    if (rate === 0) return 'bg-green-500';
    if (rate > 15 && total > 5) return 'bg-red-500';
    if (rate > 10) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Supplier Reliability Matrix</h3>
        <p className="text-sm text-muted-foreground mt-1">Hardware failure rate by vendor</p>
      </div>

      <div className="p-6">
        {supplierStats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No supplier data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {supplierStats.map((supplier) => (
              <div key={supplier.name} className="space-y-2">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{supplier.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {supplier.broken} of {supplier.total} units with issues
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${getFailureRateColor(supplier.failureRate, supplier.total)}`}>
                      {supplier.failureRate}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getProgressBarColor(supplier.failureRate, supplier.total)}`}
                    style={{ width: `${supplier.failureRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-6 py-3 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold">Note:</span> Rates highlighted in red indicate suppliers with &gt;15% failure rate on sample size &gt;5 units.
        </p>
      </div>
    </div>
  );
}
