import React, { useMemo } from 'react';

export default function SecurityAuditReport({ assets }) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const flaggedAssets = useMemo(() => {
    if (!assets) return { missing: [], staleBroken: [] };

    const missing = assets.filter((asset) => {
      const status = String(asset?.status || '').trim().toLowerCase();
      return (
        status === 'lost' ||
        status === 'stolen' ||
        status === 'missing' ||
        status.includes('lost/stolen') ||
        status.includes('lost') ||
        status.includes('stolen')
      );
    });

    const staleBroken = assets.filter((asset) => {
      if (String(asset?.status || '').trim().toLowerCase() !== 'broken') return false;

      const lastUpdate = new Date(asset?.updated_at || asset?.created_at);
      return Number.isNaN(lastUpdate.getTime()) ? false : lastUpdate < thirtyDaysAgo;
    });

    return { missing, staleBroken };
  }, [assets, thirtyDaysAgo]);

  const totalRisks = flaggedAssets.missing.length + flaggedAssets.staleBroken.length;

  const flaggedRows = [
    ...flaggedAssets.missing.map((asset) => ({
      id: `missing-${asset?.asset_tag || asset?.id || asset?.product_name}`,
      label: 'Missing asset',
      asset,
      tone: 'danger',
    })),
    ...flaggedAssets.staleBroken.map((asset) => ({
      id: `stale-broken-${asset?.asset_tag || asset?.id || asset?.product_name}`,
      label: 'Broken > 30 days',
      asset,
      tone: 'warning',
    })),
  ];

  const getAssetName = (asset) => asset?.product_name || asset?.name || asset?.asset_name || 'Unnamed asset';

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-border px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security Audit</p>
          <h2 className="text-lg font-bold text-foreground">High-Risk Asset Review</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Flagged items</p>
          <p className={`text-2xl font-bold ${totalRisks === 0 ? 'text-success' : 'text-destructive'}`}>
            {totalRisks}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {totalRisks === 0 ? (
          <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-success">
            <p className="font-semibold">All clear.</p>
            <p className="text-sm mt-1">No immediate security or compliance risks detected.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <p className="font-semibold">Attention required.</p>
            <p className="text-sm mt-1">
              {flaggedAssets.missing.length} missing asset{flaggedAssets.missing.length === 1 ? '' : 's'} and{' '}
              {flaggedAssets.staleBroken.length} broken asset{flaggedAssets.staleBroken.length === 1 ? '' : 's'} have exceeded the 30-day review window.
            </p>
          </div>
        )}

        {flaggedRows.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Items to investigate</h3>
              <span className="text-xs text-muted-foreground">Tag and asset name</span>
            </div>
            <div className="space-y-2">
              {flaggedRows.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 ${
                    row.tone === 'danger'
                      ? 'border-destructive/20 bg-destructive/5'
                      : 'border-warning/20 bg-warning/5'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${row.tone === 'danger' ? 'text-destructive' : 'text-warning'}`}>
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">{getAssetName(row.asset)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-foreground">{row.asset?.asset_tag || 'No tag'}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(row.asset?.status || 'Unknown')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
