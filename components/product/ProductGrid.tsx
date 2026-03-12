import { getProducts } from '@/lib/products';
import ProductCard from './ProductCard';

export default async function ProductGrid() {
  const products = await getProducts();

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col items-center mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-wood mb-4">
          Nuestro Catálogo
        </h2>
        <div className="w-20 h-1 bg-brand-sage rounded-full mb-6" />
        <p className="text-gray-600 max-w-2xl">
          Descubre nuestra selección de columpios y accesorios diseñados para 
          brindar alegría y seguridad a los más pequeños.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
