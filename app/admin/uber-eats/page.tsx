'use client'

import { useState } from 'react'
import ProductsTab from '@/components/uber-eats/ProductsTab'
import StoresTab from '@/components/uber-eats/StoresTab'
import ExportTab from '@/components/uber-eats/ExportTab'

type Tab = 'products' | 'stores' | 'export'

const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Catálogo Uber Eats' },
  { id: 'stores', label: 'Tiendas' },
  { id: 'export', label: 'Exportar' },
]

export default function UberEatsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products')

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'stores' && <StoresTab />}
      {activeTab === 'export' && <ExportTab />}
    </div>
  )
}
