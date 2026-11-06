import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');

  // Fetch data produk awal
  const fetchProducts = () => {
    axios.get('http://127.0.0.1:8000/api/products')
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error('Gagal ambil data produk:', error);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Tambah ke keranjang
  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Stok produk habis!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('Jumlah melebihi stok yang tersedia!');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // Update kuantitas produk di keranjang
  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const product = products.find((p) => p.id === id);
            const newQty = item.qty + delta;
            if (product && newQty > product.stock) {
              alert('Jumlah melebihi stok!');
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  // Hapus item dari keranjang
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Hitung total belanjaan
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Handle proses pembayaran
  const handleBayar = () => {
    const inputPaid = prompt(`Total Belanja: ${formatRupiah(total)}\nMasukkan jumlah uang dibayar:`);
    
    // Jika cancel atau input kosong
    if (inputPaid === null || inputPaid.trim() === '') return;

    const paidNumber = parseInt(inputPaid, 10);

    if (isNaN(paidNumber) || paidNumber < total) {
      alert('Uang pembayaran tidak cukup!');
      return;
    }

    const items = cart.map((item) => ({
      product_id: item.id,
      qty: item.qty,
    }));

    axios.post('http://127.0.0.1:8000/api/transactions', {
      items: items,
      paid: paidNumber,
    })
      .then((response) => {
        alert('Transaksi berhasil!\nKembalian: ' + formatRupiah(response.data.change));
        setCart([]);
        fetchProducts(); // Refresh stok produk
      })
      .catch((error) => {
        console.error(error);
        alert('Transaksi gagal. Cek console atau koneksi backend.');
      });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Kolom Kiri: Daftar Produk */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">DASHBOARD KASIR</h1>

        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left border border-slate-200"
            >
              <div className="text-xs font-medium text-indigo-500 mb-1">
  {product.category?.name || 'Umum'}
</div>

<div className="w-full h-40 bg-gray-50 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
  <img
    src={
      product.images
        ? `http://127.0.0.1:8000/images/${product.images}`
        : 'https://via.placeholder.com/150?text=No+Image'
    }
    alt={product.name}
    className="w-full h-full object-contain p-2"
    onError={(e) => {
      e.target.src = 'https://via.placeholder.com/150?text=No+Image';
    }}
  />
</div>
             <div className="font-semibold text-slate-800">{product.name}</div>
              <div className="text-slate-600 mt-1">{formatRupiah(product.price)}</div>
              <div className="text-xs text-slate-400 mt-1">Stok: {product.stock}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Kolom Kanan: Keranjang */}
      <div className="w-96 bg-white shadow-xl p-6 flex flex-col">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Keranjang</h2>

        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 && (
            <p className="text-slate-400 text-sm text-center mt-10">
              Belum ada produk dipilih
            </p>
          )}

          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
            >
              <div className="flex-1">
                <div className="font-medium text-slate-800 text-sm">{item.name}</div>
                <div className="text-slate-500 text-xs">{formatRupiah(item.price)}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, 1)}
                  className="w-7 h-7 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="ml-3 text-red-400 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 mt-4 pt-4">
          <div className="flex justify-between text-lg font-bold text-slate-800 mb-4">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <button
            onClick={handleBayar}
            disabled={cart.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Bayar
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;