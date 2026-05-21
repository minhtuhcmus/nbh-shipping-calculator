import { ProviderRow, type ProviderRowData } from './ProviderRow'

interface Props {
  rows: ProviderRowData[]
}

export function FeeTable({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => {
    if (a.fee === null && b.fee === null) return 0
    if (a.fee === null) return 1
    if (b.fee === null) return -1
    return a.fee - b.fee
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="py-3 px-4 text-left font-semibold text-gray-600">Nhà vận chuyển</th>
            <th className="py-3 px-4 text-left font-semibold text-gray-600">Dịch vụ</th>
            <th className="py-3 px-4 text-left font-semibold text-gray-600">Thời gian</th>
            <th className="py-3 px-4 text-right font-semibold text-gray-600">Phí (VND)</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <ProviderRow key={`${row.provider}-${row.service}-${i}`} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
