export const metadata = {
  title: "Zenin Market",
  description: "Le streetwear malgache, livré chez toi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#05070A" }}>{children}</body>
    </html>
  );
}
