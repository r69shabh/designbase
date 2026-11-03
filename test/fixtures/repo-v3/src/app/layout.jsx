import { Inter } from "next/font/google";
import "~/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }) {
  return <html className={inter.variable}><body className="font-sans">{children}</body></html>;
}
