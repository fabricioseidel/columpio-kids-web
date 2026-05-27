import type { Product } from '@/types/product'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {product.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
        <p className="font-bold text-gray-900 mt-2">${product.price.toLocaleString('es-CL')}</p>
      </div>
    </div>
  )
}
