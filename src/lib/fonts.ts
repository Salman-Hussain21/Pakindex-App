/**
 * Shared font definitions for the entire app.
 *
 * Import { poppins, montserrat } wherever you need the font CSS variables
 * --font-poppins / --font-montserrat.
 *
 * Defining them here (one module) ensures Next.js generates a single
 * layout.css chunk instead of a separate one per layout file that imports
 * next/font/google directly.
 */
import { Poppins, Montserrat } from "next/font/google";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});
