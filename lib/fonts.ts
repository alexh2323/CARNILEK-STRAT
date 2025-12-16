import { Inter, Playfair_Display } from "next/font/google"

export const uiSans = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const brandSerif = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
})


