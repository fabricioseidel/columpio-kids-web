import { supabase } from './supabase'

const BUCKET = 'product-images'
const MAX_DIM = 1000
const QUALITY = 0.8

/** Comprime una imagen en el navegador (WebP, máx 1000px) y la sube a Storage. Devuelve la URL pública. */
export async function uploadProductImage(file: File, key: string): Promise<string> {
  const compressed = await compressImage(file)
  const path = `${key}-${Date.now()}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new Error('Error subiendo imagen: ' + error.message)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/webp',
      QUALITY,
    )
  })
}
