const API_URL = 'https://fakestoreapi.com/products';

// Descripciones personalizadas por categoría
const DESCRIPCIONES = {
  "men's clothing": 'Perfecto para quienes buscan mens clothing. Calidad y estilo en un solo producto.',
  "women's clothing": 'Moda femenina con comodidad y estilo para cualquier ocasión.',
  jewelery: 'Joyería seleccionada con detalles únicos y materiales de calidad.',
  electronics: 'Tecnología confiable para tu día a día con gran rendimiento.',
  sportswear: 'Ropa deportiva oficial para fanáticos del fútbol.'
};

// Estado global
const state = {
  productos: [],
  filtro: '',
  usuario: null // { username, token }
};

// Formateador de precio
const fmtPrecio = (v) => `$${Number(v).toFixed(2)}`;

// Objeto carrito
const carrito = {
  items: [],
  agregarItem(producto) {
    const existente = this.items.find(i => i.id === producto.id);
    if (existente) {
      existente.qty += 1;
    } else {
      const desc = producto.descPersonalizada || DESCRIPCIONES[producto.category] || 'Producto destacado de nuestra tienda.';
      this.items.push({
        id: producto.id,
        title: producto.title,
        price: producto.price,
        image: producto.image,
        category: producto.category,
        descPersonalizada: desc,
        qty: 1
      });
    }
    this.renderizarCarrito();
  },
  quitarItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.renderizarCarrito();
  },
  cambiarCantidad(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.quitarItem(id);
    else this.renderizarCarrito();
  },
  calcularTotal() {
    return this.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  },
  vaciar() {
    this.items = [];
    this.renderizarCarrito();
  },
  renderizarCarrito() {
    const cont = document.getElementById('carrito-items');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');

    cont.innerHTML = '';
    if (this.items.length === 0) {
      cont.textContent = 'Tu carrito está vacío.';
    } else {
      this.items.forEach(i => {
        const row = document.createElement('div');
        row.className = 'carrito-item';
        row.innerHTML = `
          <img src="${i.image}" alt="${i.title}" />
          <div>
            <strong>${i.title}</strong>
            <div class="muted">${i.descPersonalizada}</div>
            <div class="muted">Categoría: ${i.category}</div>
            <div>Precio: ${fmtPrecio(i.price)}</div>
          </div>
          <div style="display:grid; gap:6px; justify-items:end;">
            <div style="display:flex; gap:6px; align-items:center;">
              <button class="qty-btn" data-action="dec" data-id="${i.id}">-</button>
              <span>${i.qty}</span>
              <button class="qty-btn" data-action="inc" data-id="${i.id}">+</button>
            </div>
            <button class="danger" data-action="remove" data-id="${i.id}">Eliminar</button>
          </div>
        `;
        cont.appendChild(row);
      });
    }

    countEl.textContent = this.items.reduce((acc, i) => acc + i.qty, 0);
    totalEl.textContent = fmtPrecio(this.calcularTotal());

    cont.querySelectorAll('.qty-btn, .danger').forEach(btn => {
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      btn.onclick = () => {
        if (action === 'inc') this.cambiarCantidad(id, 1);
        else if (action === 'dec') this.cambiarCantidad(id, -1);
        else if (action === 'remove') this.quitarItem(id);
      };
    });
  }
};

// Fetch y render
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar productos');
    const data = await res.json();
    state.productos = data; // ← corregido aquí
    renderProductos();
  } catch (err) {
    document.getElementById('catalogo-productos').innerHTML =
      `<p>Hubo un problema al cargar los productos. Intenta de nuevo más tarde.</p>`;
    console.error(err);
  }
}

function renderProductos() {
  const cont = document.getElementById('catalogo-productos');
  cont.innerHTML = '';

  const filtro = state.filtro.toLowerCase();
  const lista = state.productos.filter(p =>
    p.title.toLowerCase().includes(filtro) ||
    p.category.toLowerCase().includes(filtro)
  );

  if (lista.length === 0) {
    cont.innerHTML = `<p>No se encontraron productos para “${state.filtro}”.</p>`;
    return;
  }

  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    const desc = p.descPersonalizada || DESCRIPCIONES[p.category] || 'Producto destacado de nuestra tienda.';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}" />
      <h3>${p.title}</h3>
      <p>${desc}</p>
      <div class="price">${fmtPrecio(p.price)}</div>
      <div class="actions">
        <button class="primary" data-id="${p.id}">Añadir</button>
      </div>
    `;
    cont.appendChild(card);
  });

  cont.querySelectorAll('button.primary').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const prod = state.productos.find(p => p.id === id);
      carrito.agregarItem(prod);
    };
  });
}

// Búsqueda
function setupSearch() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', () => {
    state.filtro = input.value;
    renderProductos();
  });
}

// Modo oscuro
function setupDarkMode() {
  const toggle = document.getElementById('toggle-dark');
  const initial = localStorage.getItem('theme') === 'dark';
  document.body.classList.toggle('dark', initial);
  toggle.checked = initial;

  toggle.addEventListener('change', () => {
    const useDark = toggle.checked;
    document.body.classList.toggle('dark', useDark);
    localStorage.setItem('theme', useDark ? 'dark' : 'light');
  });
}

// Acciones del carrito
function setupCartActions() {
  document.getElementById('btn-empty').onclick = () => carrito.vaciar();
  document.getElementById('btn-checkout').onclick = () => {
    if (carrito.items.length === 0) return alert('Tu carrito está vacío.');
    if (!state.usuario) return alert('Inicia sesión para finalizar la compra.');
    alert(`Gracias, ${state.usuario.username}. Total: ${fmtPrecio(carrito.calcularTotal())}.`);
    carrito.vaciar();
   };
}

// Login
function setupLogin() {
  const modal = document.getElementById('login-modal');
  const btnOpen = document.getElementById('btn-login');
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const userStatus = document.getElementById('user-status');

  btnOpen.onclick = () => modal.showModal();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    errorEl.hidden = true;

    try {
      const res = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Credenciales inválidas');
      const data = await res.json();
      state.usuario = { username: data.username, token: data.token };
      userStatus.textContent = data.username;
      modal.close();
    } catch (err) {
      errorEl.textContent = 'Usuario o contraseña incorrectos.';
      errorEl.hidden = false;
    }
  });
}


// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupDarkMode();
  setupSearch();
  setupCartActions();
  setupLogin();
  cargarProductos();
});