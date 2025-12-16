export async function fileToCompressedDataUrl(file: File, opts?: { maxWidth?: number; quality?: number }) {
  const maxWidth = opts?.maxWidth ?? 1400
  const quality = opts?.quality ?? 0.82

  const img = await loadImageFromFile(file)
  const { width, height } = fitWithin(img.width, img.height, maxWidth)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D indisponible")

  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL("image/webp", quality)
}

function fitWithin(w: number, h: number, maxW: number) {
  if (w <= maxW) return { width: w, height: h }
  const ratio = maxW / w
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de charger l'image"))
    }
    img.src = url
  })
}


