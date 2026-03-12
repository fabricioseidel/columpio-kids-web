import { Product } from '@/types/product';
import { supabase } from './supabase';

export const products: Product[] = [
  {
    id: '1',
    name: 'Columpio Premium Nórdico',
    description: 'Madera natural y telas orgánicas para el máximo confort.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80',
    category: 'swing',
  },
  {
    id: '2',
    name: 'Balancín de Madera',
    description: 'Diseño ergonómico para fomentar el equilibrio y la diversión.',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80',
    category: 'rocker',
  },
  {
    id: '3',
    name: 'Cojín Nube Soft',
    description: 'El complemento perfecto para cualquier columpio Columpio Kids.',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80',
    category: 'accessory',
  },
  {
    id: '4',
    name: 'Pack Aventura',
    description: 'Columpio + Balancín a un precio especial.',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1566458082527-d92fa44794a1?auto=format&fit=crop&q=80',
    category: 'swing',
  }
];

export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*');
  
  if (error || !data || data.length === 0) {
    console.log('Falling back to local product data...');
    return products;
  }
  
  return data as Product[];
}
