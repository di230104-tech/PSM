import React, { useMemo } from 'react'

export default function EOLBudgetReport({ assets = [] }) {
  const AVERAGE_REPLACEMENT_COST = 3500

  const eolData = useMemo(() => {
    if (!assets || assets.length === 0) return { eolAssets: [], totalBudgetNeeded: 0 }

    const fourYearsAgo = new Date()
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4)

    const eolAssets = assets.filter((asset) => {
      const status = asset?.status || ''
      if (status === 'Lost' || status === 'Stolen') return false

      const acquiredRaw = asset.purchase_date || asset.created_at || null
      if (!acquiredRaw) return false
      const acquiredDate = new Date(acquiredRaw)
      if (isNaN(acquiredDate)) return false

      return acquiredDate < fourYearsAgo
    })

    const totalBudgetNeeded = eolAssets.length * AVERAGE_REPLACEMENT_COST

    return { eolAssets, totalBudgetNeeded }
  }, [assets])

  const { eolAssets, totalBudgetNeeded } = eolData

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">End-of-Life (EOL) Budget Forecast</h3>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-bold">RM {totalBudgetNeeded.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Estimated budget required to replace {eolAssets.length} assets older than 4 years.</div>
        </div>
      </div>

      <div className="mt-4 max-h-40 overflow-auto">
        {eolAssets.length === 0 ? (
          <div className="text-sm text-green-600">All clear — no assets older than 4 years.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500 border-b">
              <tr>
                <th className="py-1">Asset Tag</th>
                <th className="py-1">Name</th>
                <th className="py-1">Purchase Date</th>
              </tr>
            </thead>
            <tbody>
              {eolAssets.map((a) => {
                const dateRaw = a.purchase_date || a.created_at || ''
                const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString() : 'Unknown'
                return (
                  <tr key={a.id || a.asset_tag} className="border-b last:border-0">
                    <td className="py-1">{a.asset_tag}</td>
                    <td className="py-1">{a.product_name || a.name || '—'}</td>
                    <td className="py-1">{dateStr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
