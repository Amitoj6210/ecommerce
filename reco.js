// reco.js — fills the scrollable recommendation row and reuses your .add-to-cart logic
const FALLBACK = [
  { id:'pro1', name:'Tropical Vibe Shirt', price:78, img:'pro1.png', chip:'Best seller' },
  { id:'pro2', name:'Palm Whisper Shirt',  price:50, img:'pro2.png', chip:'Clearance'  },
  { id:'pro3', name:'Rustic Bloom Shirt',  price:20, img:'pro3.png', chip:'Deal'       },
  { id:'pro4', name:'Cherry Mist Shirt',   price:90, img:'pro4.png', chip:'Trending'  },
  { id:'pro5', name:'Urban Contrast Shirt',price:120,img:'pro5.png', chip:'Premium'   },
  { id:'pro6', name:'Evergreen Henley',    price:80, img:'pro6.png', chip:'Hot'       },
  { id:'pro7', name:'Victorious Shirt',    price:100,img:'pro7.png', chip:'Choice'    },
  { id:'pro8', name:'Coastal Breeze Shirt',price:110,img:'pro8.png', chip:'Popular'   },
];

const DATA = (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length)
  ? window.PRODUCTS.map(p => ({
      id: p.id || p.sku || crypto.randomUUID(),
      name: p.title || p.name,
      price: Number(p.price || p.priceValue || 0),
      img: p.img || p.image || 'pro1.png',
      chip: p.badge || 'Popular'
    }))
  : FALLBACK;

const money = n => `$${Number(n || 0).toFixed(2)}`;

function card(p){
  return `
  <article class="reco-card">
    <span class="reco-chip">${p.chip}</span>
    <img src="${p.img}" alt="${p.name}">
    <div class="reco-name">${p.name}</div>
    <div class="reco-price">${money(p.price)}</div>
    <button class="add-to-cart"
            data-id="${p.id}"
            data-name="${p.name.replace(/"/g,'&quot;')}"
            data-price="${p.price}"
            data-img="${p.img}"
            data-qty="1">Add to cart</button>
  </article>`;
}

function renderRecos(){
  const row = document.getElementById('reco-row');
  if (!row) return;
  row.innerHTML = DATA.map(card).join('');

  const prev = document.querySelector('.reco-btn[data-dir="prev"]');
  const next = document.querySelector('.reco-btn[data-dir="next"]');
  const step = Math.round(row.clientWidth * 0.9);

  prev?.addEventListener('click', () => row.scrollBy({ left: -step, behavior: 'smooth' }));
  next?.addEventListener('click', () => row.scrollBy({ left:  step, behavior: 'smooth' }));
}
document.addEventListener('DOMContentLoaded', renderRecos);