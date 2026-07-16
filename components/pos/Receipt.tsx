'use client'

import { clp, fecha } from '@/lib/format'
import type { Sale, SaleItem, StoreSettings } from '@/types/db'

export type ReceiptData = {
  sale: Sale
  items: SaleItem[]
  settings: StoreSettings | null
}

const METODOS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

/**
 * Boleta de venta (ticket de cortesía) para papel térmico de 80 mm.
 * Solo visible al imprimir (clase .print-only definida en globals.css).
 * Nota: no reemplaza la boleta electrónica del SII.
 */
export default function Receipt({ data }: { data: ReceiptData | null }) {
  if (!data) return null
  const { sale, items, settings } = data

  return (
    <div className="print-only receipt">
      <div className="text-center">
        <div className="receipt-title">{settings?.store_name || 'Columpio Kids'}</div>
        {settings?.store_address && <div>{settings.store_address}</div>}
        {settings?.store_phone && <div>Tel: {settings.store_phone}</div>}
      </div>

      <div className="receipt-divider" />
      <div>Boleta N° {String(sale.id).padStart(6, '0')}</div>
      <div>{fecha(sale.ts)}</div>
      <div className="receipt-divider" />

      <table className="receipt-table">
        <thead>
          <tr>
            <th className="text-left">Producto</th>
            <th className="text-right">Cant</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>
                {it.product_name}
                {it.quantity !== 1 && <div className="receipt-sub">{clp(it.unit_price)} c/u</div>}
              </td>
              <td className="text-right align-top">{it.quantity}</td>
              <td className="text-right align-top">{clp(it.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider" />
      {sale.discount > 0 && (
        <>
          <div className="receipt-row"><span>Subtotal</span><span>{clp(sale.subtotal)}</span></div>
          <div className="receipt-row"><span>Descuento</span><span>-{clp(sale.discount)}</span></div>
        </>
      )}
      <div className="receipt-row receipt-total"><span>TOTAL</span><span>{clp(sale.total)}</span></div>
      <div className="receipt-row"><span>Pago</span><span>{METODOS[sale.payment_method] ?? sale.payment_method}</span></div>
      {sale.cash_received != null && (
        <>
          <div className="receipt-row"><span>Recibido</span><span>{clp(sale.cash_received)}</span></div>
          <div className="receipt-row"><span>Vuelto</span><span>{clp(sale.change_given)}</span></div>
        </>
      )}

      <div className="receipt-divider" />
      <div className="text-center">
        <div>{settings?.receipt_footer || '¡Gracias por su compra!'}</div>
        <div className="receipt-sub">Documento interno — no válido como boleta tributaria</div>
      </div>
    </div>
  )
}
