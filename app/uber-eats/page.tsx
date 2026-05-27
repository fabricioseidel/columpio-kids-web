'use client'

import { useState } from 'react'
import ProductsTab from '@/components/uber-eats/ProductsTab'
import StoresTab from '@/components/uber-eats/StoresTab'
import ExportTab from '@/components/uber-eats/ExportTab'

type Tab = 'products' | 'stores' | 'export'

const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Catálogo' },
  { id: 'stores', label: 'Tiendas' },
  { id: 'export', label: 'Exportar' },
]

export default function UberEatsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Columpio Kids</h1>
            <p className="text-sm text-gray-500">Gestión de catálogo Uber Eats</p>
          </div>
          <span className="text-xs font-medium bg-black text-white px-3 py-1 rounded-full">
            Uber Eats
          </span>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'stores' && <StoresTab />}
        {activeTab === 'export' && <ExportTab />}
      </main>
    </div>
  )
}
