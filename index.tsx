
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Critical Render Error:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
        <div style="text-align: center; max-width: 400px; padding: 20px;">
          <h2 style="color: #e11d48;">Aplikasi Gagal Dimuat</h2>
          <p style="color: #64748b;">Terjadi kesalahan sistem saat inisialisasi. Silakan refresh halaman.</p>
          <pre style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 12px; overflow: auto;">${err instanceof Error ? err.message : String(err)}</pre>
          <button onclick="location.reload()" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Refresh</button>
        </div>
      </div>
    `;
  }
}
