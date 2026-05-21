export type RowStatus = 'loading' | 'ok' | 'unavailable'

export interface ProviderRowData {
  provider: string
  service: string
  eta: string
  fee: number | null
  estimated: boolean
  status: RowStatus
}

interface Props {
  row: ProviderRowData
}

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫'
}

export function ProviderRow({ row }: Props) {
  if (row.status === 'loading') {
    return (
      <tr className="border-b border-gray-100 animate-pulse">
        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
        <td className="py-3 px-4 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto" /></td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 font-medium text-gray-900">{row.provider}</td>
      <td className="py-3 px-4 text-gray-600">{row.service}</td>
      <td className="py-3 px-4 text-gray-500 text-sm">{row.eta}</td>
      <td className="py-3 px-4 text-right">
        {row.status === 'unavailable' || row.fee === null ? (
          <span className="text-gray-400 text-sm">Không khả dụng</span>
        ) : (
          <span className="font-semibold text-gray-900">
            {formatVnd(row.fee)}
            {row.estimated && (
              <span className="ml-2 text-xs font-normal bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                Ước tính
              </span>
            )}
          </span>
        )}
      </td>
    </tr>
  )
}
