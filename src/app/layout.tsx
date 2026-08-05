import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-heading",
    display: "swap",
});

export const metadata: Metadata = {
    title: "CGAP Portal",
    description: "Convergent Graduate Academy Program — Fellow lifecycle, curriculum, and evaluation portal.",
    icons: {
        icon: "/favicon.png",
        apple: "/cgap-logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
            <body className="font-sans antialiased selection:bg-primary/10 overflow-x-hidden">
                {children}
            </body>
        </html>
    );
}
