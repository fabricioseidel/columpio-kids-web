'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/admin/pos', label: 'POS', icon: '🛒' },
  { href: '/admin/catalogo', label: 'Catálogo', icon: '📦' },
  { href: '/admin/ventas', label: 'Ventas', icon: '🧾' },
  { href: '/admin/inventario', label: 'Inventario', icon: '📋' },
  { href: '/admin/proveedores', label: 'Proveedores', icon: '🚚' },
  { href: '/admin/reportes', label: 'Reportes', icon: '📈' },
  { href: '/admin/uber-eats', label: 'Uber Eats', icon: '🛵' },
  { href: '/admin/calculadora', label: 'Calculadora', icon: '🧮' },
  { href: '/admin/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login')
      else setAuthed(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Verificando sesión...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <header className="bg-white border-b border-gray-200 print:hidden sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Columpio Kids</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
            Cerrar sesión
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <nav className="flex whitespace-nowrap">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  pathname?.startsWith(item.href)
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
