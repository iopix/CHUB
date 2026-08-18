import './globals.css';

export const metadata = {
  title: 'SukaChub Virtual Chat',
  description: 'AI Virtual Chat Companion with Login',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, backgroundColor: '#000000', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}