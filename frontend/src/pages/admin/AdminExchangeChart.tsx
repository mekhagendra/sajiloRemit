import { useEffect, useState, useCallback } from 'react';
import {
  adminGetExchangeChart,
  adminUpdateChartRate,
  adminTakeSnapshot,
  adminListSnapshots,
  adminGetSnapshot,
} from '../../api';
import type { Country, ExchangeChartCell, SnapshotListItem } from '../../types';
import { BarChart3, Camera, History, Save, X, TrendingUp, TrendingDown, Minus, Monitor, Filter } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

interface ChartRemitter {
  _id: string;
  brandName: string;
  legalName: string;
  logo: string;
}

type Matrix = Record<string, Record<string, ExchangeChartCell>>;

const TODAY = new Date().toISOString().slice(0, 10);

export default function AdminExchangeChart() {
  const [remitters, setRemitters] = useState<ChartRemitter[]>([]);
  const [matrix, setMatrix] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState(TODAY);
  const [filterRemitterId, setFilterRemitterId] = useState('');

  // Display data (driven by filterDate — may be snapshot or live)
  const [displayCountries, setDisplayCountries] = useState<Country[]>([]);
  const [displayRemitters, setDisplayRemitters] = useState<ChartRemitter[]>([]);
  const [displayMatrix, setDisplayMatrix] = useState<Matrix>({});
  const [displayLoading, setDisplayLoading] = useState(false);

  // Inline edit state
  const [editCell, setEditCell] = useState<{ remitterId: string; currency: string } | null>(null);
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
  const [historyRemitters, setHistoryRemitters] = useState<ChartRemitter[]>([]);
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
      setRemitters(res.data.remitters);
      setMatrix(res.data.matrix);
      // Initialise display with live data (default date = today)
      setDisplayCountries(res.data.countries);
      setDisplayRemitters(res.data.remitters);
      setDisplayMatrix(res.data.matrix);
    } catch {
      console.error('Failed to load exchange chart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChart(); }, [loadChart]);

  const loadDisplay = useCallback(async (date: string) => {
    setEditCell(null);
    if (date >= TODAY) {
      // Today or future: reload live rates
      setDisplayLoading(true);
      try {
        const res = await adminGetExchangeChart();
        setRemitters(res.data.remitters);
        setMatrix(res.data.matrix);
        setDisplayCountries(res.data.countries);
        setDisplayRemitters(res.data.remitters);
        setDisplayMatrix(res.data.matrix);
      } catch {
        console.error('Failed to reload chart');
      } finally {
        setDisplayLoading(false);
      }
      return;
    }
    // Past date: load snapshot
    setDisplayLoading(true);
    try {
      const res = await adminGetSnapshot(date);
      setDisplayCountries(res.data.countries);
      setDisplayRemitters(res.data.remitters);
      setDisplayMatrix(res.data.matrix);
    } catch {
      setDisplayCountries([]);
      setDisplayRemitters([]);
      setDisplayMatrix({});
    } finally {
      setDisplayLoading(false);
    }
  }, []);

  const handleDateChange = (date: string) => {
    setFilterDate(date);
    void loadDisplay(date);
  };

  const isEditable = filterDate === TODAY;
  const visibleRemitters = filterRemitterId
    ? displayRemitters.filter(v => v._id === filterRemitterId)
    : displayRemitters;

  const handleCellClick = (remitterId: string, currency: string) => {
    const cell = matrix[remitterId]?.[currency];
    setEditCell({ remitterId, currency });
    setEditValue(cell ? String(cell.rate) : '');
  };

  const handleSave = async () => {
    if (!editCell) return;
    const rate = parseFloat(editValue);
    if (isNaN(rate) || rate <= 0) return;

    setSaving(true);
    try {
      const res = await adminUpdateChartRate({
        remitterId: editCell.remitterId,
        fromCurrency: editCell.currency,
        toCurrency: 'NPR',
        rate,
      });
      // Update live matrix and display matrix
      const patch = (prev: Matrix) => ({
        ...prev,
        [editCell!.remitterId]: {
          ...prev[editCell!.remitterId],
          [editCell!.currency]: res.data.cell,
        },
      });
      setMatrix(patch);
      setDisplayMatrix(patch);
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
      setHistoryRemitters(res.data.remitters);
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
    vList: ChartRemitter[],
    m: Matrix,
    editable: boolean,
    baseMatrix?: Matrix, // previous snapshot to compare against
  ) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-b border-r min-w-[180px]">
              Remitter
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
                {v.brandName || v.legalName}
              </td>
              {cList.map((c) => {
                const cell = m[v._id]?.[c.currency!];
                const baseCell = baseMatrix?.[v._id]?.[c.currency!];
                const isEditing = editable && editCell?.remitterId === v._id && editCell?.currency === c.currency;

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
                          step="0.000001"
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
                        {formatCurrency(cell.rate)}
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
          Rates are for <strong>→ NPR</strong> conversion. Select <strong>today</strong> to edit rates; past dates are read-only snapshots; future dates show current rates as a projection.
        </p>

        {/* Date + Remitter filter bar */}
        <div className="flex items-center gap-4 flex-wrap bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Filter</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => handleDateChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {filterDate !== TODAY && (
              <button
                onClick={() => handleDateChange(TODAY)}
                className="text-xs text-green-600 hover:underline"
              >
                Reset to today
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Remitter</label>
            <select
              value={filterRemitterId}
              onChange={e => setFilterRemitterId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">All Remitters</option>
              {remitters.map(v => (
                <option key={v._id} value={v._id}>{v.brandName || v.legalName}</option>
              ))}
            </select>
          </div>
          {filterDate !== TODAY && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium border ${
              filterDate < TODAY
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {filterDate < TODAY ? '🔒 Read-only — past snapshot' : '📊 Projection — future date (current rates)'}
            </span>
          )}
        </div>

        {/* Current Chart */}
        {loading || displayLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : visibleRemitters.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
            {filterRemitterId
              ? 'No data for the selected Remitter on this date.'
              : filterDate < TODAY
              ? 'No snapshot found for this date. Take a snapshot first using "Take Snapshot".'
              : 'No approved Remitters found. Approve Remitters first to populate the chart.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {renderMatrix(displayCountries, visibleRemitters, displayMatrix, isEditable)}
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
                ) : historyRemitters.length === 0 ? (
                  <p className="text-sm text-gray-500">No data in this snapshot.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    {renderMatrix(
                      historyCountries,
                      historyRemitters,
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
