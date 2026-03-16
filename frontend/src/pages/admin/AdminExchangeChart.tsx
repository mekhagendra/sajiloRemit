import { useEffect, useState, useCallback } from 'react';
import {
  adminGetExchangeChart,
  adminUpdateChartRate,
  adminTakeSnapshot,
  adminListSnapshots,
  adminGetSnapshot,
} from '../../api';
import type { Country, ExchangeChartCell, SnapshotListItem } from '../../types';
import { BarChart3, Camera, History, Save, X, TrendingUp, TrendingDown, Minus, Monitor } from 'lucide-react';

interface ChartVendor {
  _id: string;
  companyName: string;
  logo: string;
}

type Matrix = Record<string, Record<string, ExchangeChartCell>>;

export default function AdminExchangeChart() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [vendors, setVendors] = useState<ChartVendor[]>([]);
  const [matrix, setMatrix] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editCell, setEditCell] = useState<{ vendorId: string; currency: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Snapshot
  const [snapshotMsg, setSnapshotMsg] = useState('');
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotListItem[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [historyCountries, setHistoryCountries] = useState<Country[]>([]);
  const [historyVendors, setHistoryVendors] = useState<ChartVendor[]>([]);
  const [historyMatrix, setHistoryMatrix] = useState<Matrix>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  // Trend comparison
  const [compareDate, setCompareDate] = useState<string | null>(null);
  const [compareMatrix, setCompareMatrix] = useState<Matrix>({});
  const [compareLoading, setCompareLoading] = useState(false);

  const loadChart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminGetExchangeChart();
      setCountries(res.data.countries);
      setVendors(res.data.vendors);
      setMatrix(res.data.matrix);
    } catch {
      console.error('Failed to load exchange chart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChart(); }, [loadChart]);

  const handleCellClick = (vendorId: string, currency: string) => {
    const cell = matrix[vendorId]?.[currency];
    setEditCell({ vendorId, currency });
    setEditValue(cell ? String(cell.rate) : '');
  };

  const handleSave = async () => {
    if (!editCell) return;
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate <= 0) return;

    setSaving(true);
    try {
      const res = await adminUpdateChartRate({
        vendorId: editCell.vendorId,
        fromCurrency: editCell.currency,
        toCurrency: 'NPR',
        rate,
      });
      // Update matrix locally
      setMatrix((prev) => ({
        ...prev,
        [editCell.vendorId]: {
          ...prev[editCell.vendorId],
          [editCell.currency]: res.data.cell,
        },
      }));
      setEditCell(null);
    } catch {
      console.error('Failed to save rate');
    } finally {
      setSaving(false);
    }
  };

  const handleSnapshot = async () => {
    setTakingSnapshot(true);
    setSnapshotMsg('');
    try {
      const res = await adminTakeSnapshot();
      setSnapshotMsg(`Snapshot saved for ${res.data.date} (${res.data.rateCount} rates)`);
    } catch {
      setSnapshotMsg('Failed to take snapshot');
    } finally {
      setTakingSnapshot(false);
    }
  };

  const loadSnapshots = async () => {
    setSnapshotsLoading(true);
    try {
      const res = await adminListSnapshots({ limit: 60 });
      setSnapshots(res.data.snapshots);
    } catch {
      console.error('Failed to load snapshots');
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) loadSnapshots();
    setShowHistory(!showHistory);
    setViewDate(null);
  };

  const viewSnapshot = async (date: string) => {
    setHistoryLoading(true);
    setViewDate(date);
    setCompareDate(null);
    try {
      const res = await adminGetSnapshot(date);
      setHistoryCountries(res.data.countries);
      setHistoryVendors(res.data.vendors);
      setHistoryMatrix(res.data.matrix);
    } catch {
      console.error('Failed to load snapshot');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadComparison = async (date: string) => {
    setCompareLoading(true);
    setCompareDate(date);
    try {
      const res = await adminGetSnapshot(date);
      setCompareMatrix(res.data.matrix);
    } catch {
      console.error('Failed to load comparison snapshot');
    } finally {
      setCompareLoading(false);
    }
  };

  /** Render a trend indicator comparing current vs previous value */
  const renderTrend = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.005) return <Minus className="w-3 h-3 text-gray-400 inline ml-1" />;
    if (diff > 0) return <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />;
    return <TrendingDown className="w-3 h-3 text-red-500 inline ml-1" />;
  };

  const renderMatrix = (
    cList: Country[],
    vList: ChartVendor[],
    m: Matrix,
    editable: boolean,
    baseMatrix?: Matrix, // previous snapshot to compare against
  ) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-b border-r min-w-[180px]">
              Agent / Vendor
            </th>
            {cList.map((c) => (
              <th key={c._id} className="px-3 py-3 text-center font-semibold text-gray-700 border-b min-w-[110px]">
                <div className="flex flex-col items-center gap-0.5">
                  {c.flag && <span className="text-lg leading-none">{c.flag}</span>}
                  <span className="text-xs font-bold">{c.name}</span>
                  <span className="text-[10px] text-gray-400">{c.currency}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vList.map((v, idx) => (
            <tr key={v._id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-green-50/40`}>
              <td className={`sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-2.5 font-medium text-gray-800 border-r whitespace-nowrap`}>
                {v.companyName}
              </td>
              {cList.map((c) => {
                const cell = m[v._id]?.[c.currency!];
                const baseCell = baseMatrix?.[v._id]?.[c.currency!];
                const isEditing = editable && editCell?.vendorId === v._id && editCell?.currency === c.currency;

                return (
                  <td
                    key={c._id}
                    className={`px-2 py-2.5 text-center border-r ${
                      editable ? 'cursor-pointer hover:bg-green-50' : ''
                    } ${isEditing ? 'bg-green-50 ring-2 ring-green-400 ring-inset' : ''}`}
                    onClick={() => editable && !isEditing && handleCellClick(v._id, c.currency!)}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 px-1 py-0.5 text-sm border rounded text-center focus:outline-none focus:ring-1 focus:ring-green-400"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') setEditCell(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSave(); }}
                          disabled={saving}
                          className="p-0.5 text-green-600 hover:text-green-800"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditCell(null); }}
                          className="p-0.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : cell ? (
                      <span className="font-semibold text-green-700">
                        {cell.rate.toFixed(2)}
                        {baseMatrix && renderTrend(cell.rate, baseCell?.rate)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {/* Small screen gate: hidden on >= 992px, shown below */}
      <div className="[@media(min-width:992px)]:hidden flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Monitor className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Larger Screen Required</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          The Exchange Chart requires a screen width of at least 992px. Please use a desktop or laptop to access this feature.
        </p>
      </div>

      {/* Chart content: only shown on screens >= 992px */}
      <div className="hidden [@media(min-width:992px)]:block p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Currency Exchange Chart</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSnapshot}
              disabled={takingSnapshot}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              <Camera className="w-4 h-4" />
              {takingSnapshot ? 'Saving…' : 'Take Snapshot'}
            </button>
            <button
              onClick={toggleHistory}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                showHistory
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
        </div>

        {snapshotMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
            {snapshotMsg}
          </div>
        )}

        <p className="text-sm text-gray-500">
          Click any cell to update the rate. Rates are for <strong>→ NPR</strong> conversion.
          A daily snapshot is taken automatically on server startup. Country names are shown in the header row, agents/vendors in the first column.
        </p>

        {/* Current Chart */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
            No approved vendors found. Approve vendors first to populate the chart.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {renderMatrix(countries, vendors, matrix, true)}
          </div>
        )}

        {/* History Section */}
        {showHistory && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />
              Snapshot History &amp; Trend
            </h2>

            {snapshotsLoading ? (
              <div className="animate-pulse h-8 bg-gray-100 rounded w-1/2" />
            ) : snapshots.length === 0 ? (
              <p className="text-gray-500 text-sm">No snapshots yet. Click "Take Snapshot" to save today's rates.</p>
            ) : (
              <>
                {/* Snapshot date selector */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Select a date to view its snapshot:</p>
                  <div className="flex flex-wrap gap-2">
                    {snapshots.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => viewSnapshot(s.date)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          viewDate === s.date
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s.date}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trend comparison selector */}
                {viewDate && snapshots.length >= 2 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      Compare with an earlier date to see trend ({<TrendingUp className="w-3 h-3 text-green-500 inline" />} up, {<TrendingDown className="w-3 h-3 text-red-500 inline" />} down):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {snapshots
                        .filter((s) => s.date < viewDate)
                        .map((s) => (
                          <button
                            key={s._id}
                            onClick={() => loadComparison(s.date)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              compareDate === s.date
                                ? 'bg-orange-500 text-white'
                                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                          >
                            vs {s.date}
                          </button>
                        ))}
                      {compareDate && (
                        <button
                          onClick={() => { setCompareDate(null); setCompareMatrix({}); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 text-gray-600 hover:bg-gray-300"
                        >
                          Clear comparison
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {viewDate && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  Snapshot: {viewDate}
                  {compareDate && !compareLoading && (
                    <span className="ml-2 text-orange-600 text-xs font-normal">
                      (compared with {compareDate})
                    </span>
                  )}
                </h3>
                {historyLoading ? (
                  <div className="animate-pulse h-12 bg-gray-100 rounded" />
                ) : historyVendors.length === 0 ? (
                  <p className="text-sm text-gray-500">No data in this snapshot.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    {renderMatrix(
                      historyCountries,
                      historyVendors,
                      historyMatrix,
                      false,
                      compareDate && !compareLoading ? compareMatrix : undefined,
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
