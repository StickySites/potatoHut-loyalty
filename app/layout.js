import "./globals.css";

export const metadata = {
  title: {
    default: "Potato Hut Loyalty",
    template: "%s | Potato Hut Loyalty"
  },
  description: "Collect stamps and earn free meals at Potato Hut Watford."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/*
          Google Fonts stylesheet (not next/font): Turbopack corrupts next/font
          unicode-range (U+0000-00FF → U+??), so Latin text never hits the real faces.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=League+Spartan:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans font-semibold antialiased">{children}</body>
    </html>
  );
}
