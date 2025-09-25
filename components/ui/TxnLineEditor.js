
'use client'
import { Plus, Trash2 } from 'lucide-react'
import { ItemSelect } from './ItemSelect'
import { SelectField } from './SelectField'

export function TxnLineEditor({ lines = [], onChange, locations = [] }) {
  function addLine() {
    onChange([
      ...lines,
      { id: Math.random().toString(36).slice(2), qty: '', unitCost: '' }
    ])
  }

  function removeLine(index) {
    onChange(lines.filter((_, i) => i !== index))
  }

  function updateLine(index, updates) {
    onChange(
      lines.map((line, i) => (i === index ? { ...line, ...updates } : line))
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[--color-border] text-left">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium">Location</th>
              <th className="pb-2 font-medium w-32">Quantity</th>
              <th className="pb-2 font-medium w-32">Unit Cost</th>
              <th className="pb-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id} className="border-b border-[--color-border]">
                <td className="py-2">
                  <ItemSelect
                    value={line.item}
                    onChange={item => updateLine(index, { item })}
                  />
                </td>
                <td className="py-2">
                  <SelectField
                    options={locations}
                    value={line.locationId}
                    onChange={locationId => updateLine(index, { locationId })}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    className="input"
                    value={line.qty}
                    onChange={e => updateLine(index, { qty: e.target.value })}
                    min="0"
                    step="1"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    className="input"
                    value={line.unitCost}
                    onChange={e => updateLine(index, { unitCost: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="p-1 text-[--color-silver] hover:text-[--color-danger]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addLine}
        className="btn border border-[--color-border] hover:bg-[--color-muted]"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Line
      </button>
    </div>
  )
}
