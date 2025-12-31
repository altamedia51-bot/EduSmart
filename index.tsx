
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Gagal menemukan elemen root!");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Render Error:", err);
    rootElement.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
      <h2>Terjadi Kesalahan Aplikasi</h2>
      <p>${err instanceof Error ? err.message : 'Unknown Error'}</p>
      <button onclick="location.reload()">Refresh Halaman</button>
    </div>`;
  }
}
