/* sscript.js — Cart with Supabase (if set) or LocalStorage fallback + checkout + addbar */
(() => {
 // === OPTIONAL: set these to use Supabase ===
 const SUPABASE_URL = ''; // e.g. 'https://abcd1234.supabase.co'
 const SUPABASE_ANON_KEY = ''; // anon public key
 const TABLE = 'cart_items';

 // decide mode
 const sdkReady = !!window.supabase;
 const credsReady =
 typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('https://') &&
 typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 20 &&
 !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-');

 const useSupabase = sdkReady && credsReady;
 const supabase = useSupabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

 // ---------- LocalStorage with product-level qty ----------
 const LS_KEY = 'ecopro_cart';
 const ls = {
 list() {
 try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
 },
 save(items) { localStorage.setItem(LS_KEY, JSON.stringify(items)); },
 getByPid(pid) { return this.list().find(i => i.product_id === pid) || null; },
 setQty(pid, qty, template) {
 const items = this.list();
 const i = items.findIndex(x => x.product_id === pid);
 if (qty <= 0) {
 if (i >= 0) items.splice(i, 1);
 } else if (i >= 0) {
 items[i].qty = qty;
 } else {
 items.unshift({ id: Date.now(), created_at: new Date().toISOString(), qty, ...template });
 }
 this.save(items);
 return true;
 },
 addOrInc(row) {
 const cur = this.getByPid(row.product_id);
 const qty = Number(row.qty || 1) + Number(cur?.qty || 0);
 return this.setQty(row.product_id, qty, row);
 },
 countQty() { return this.list().reduce((s,i)=> s + Number(i.qty||1), 0); },
 removeByPid(pid) {
 const items = this.list().filter(i => i.product_id !== pid);
 this.save(items); return true;
 },
 clear() { localStorage.removeItem(LS_KEY); }
 };

 // ---------- DB facade: unified API ----------
 const db = {
 async list() {
 if (useSupabase) {
 const { data, error } = await supabase.from(TABLE).select('*').order('created_at',{ascending:false});
 if (error) throw error;
 return data || [];
 }
 return ls.list();
 },
 async countQty() {
 const items = await this.list();
 return items.reduce((s,i)=> s + Number(i.qty || 1), 0);
 },
 async addOrInc(row) {
 if (useSupabase) {
 const { data, error } = await supabase.from(TABLE)
 .select('id,qty').eq('product_id', row.product_id).limit(1).maybeSingle();
 if (error && error.code !== 'PGRST116') throw error; // ignore "no rows" error
 if (data && data.id) {
 const newQty = Number(data.qty || 0) + Number(row.qty || 1);
 const { error: upErr } = await supabase.from(TABLE).update({ qty: newQty }).eq('id', data.id);
 if (upErr) throw upErr;
 return true;
 } else {
 const { error: insErr } = await supabase.from(TABLE).insert([row]);
 if (insErr) throw insErr;
 return true;
 }
 }
 return ls.addOrInc(row);
 },
 async setQty(pid, qty, template) {
 if (useSupabase) {
 if (qty <= 0) {
 const { error } = await supabase.from(TABLE).delete().eq('product_id', pid);
 if (error) throw error; return true;
 }
 // fetch existing id then update or insert
 const { data, error } = await supabase.from(TABLE).select('id').eq('product_id', pid).limit(1).maybeSingle();
 if (error && error.code !== 'PGRST116') throw error;
 if (data && data.id) {
 const { error: upErr } = await supabase.from(TABLE).update({ qty }).eq('id', data.id);
 if (upErr) throw upErr;
 return true;
 } else {
 const seed = template || { name:'Item', price:0, image:null };
 const { error: insErr } = await supabase.from(TABLE).insert([{ product_id: pid, qty, ...seed }]);
 if (insErr) throw insErr; return true;
 }
 }
 return ls.setQty(pid, qty, template);
 },
 async changeQty(pid, delta, template) {
 const items = await this.list();
 const cur = items.find(i => i.product_id === pid);
 const next = Number(cur?.qty || 0) + Number(delta || 0);
 return this.setQty(pid, next, template || cur);
 },
 async removeByPid(pid) {
 if (useSupabase) {
 const { error } = await supabase.from(TABLE).delete().eq('product_id', pid);
 if (error) throw error; return true;
 }
 return ls.removeByPid(pid);
 },
 async clear() {
 if (useSupabase) {
 const { error } = await supabase.from(TABLE).delete().neq('id', 0);
 if (error) throw error; return true;
 }
 return ls.clear();
 }
 };

 // ---------- DOM helpers + toast + addbar ----------
 const $ = (s, r=document) => r.querySelector(s);
 const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
 const money = n => `$${Number(n || 0).toFixed(2)}`;

 function ensureToast(){
 let t = $('#toast');
 if(!t){
 t = document.createElement('div');
 t.id = 'toast';
 document.body.appendChild(t);
 }
 if (!t.dataset.styled) {
 t.style.cssText = 'position:fixed;top:90px;right:20px;background:#222;color:#fff;padding:10px 14px;border-radius:10px;font-size:14px;opacity:0;transform:translateY(-10px);transition:opacity .25s,transform .25s;z-index:9999';
 t.dataset.styled = '1';
 }
 return t;
 }
 function showToast(msg){
 const t = ensureToast();
 t.textContent = msg;
 t.style.opacity = '1';
 t.style.transform = 'translateY(0)';
 clearTimeout(t._h);
 t._h = setTimeout(()=>{ t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; }, 1400);
 }

 function ensureAddBar(){
 let el = document.querySelector('.addbar');
 if (el) return el;

 el = document.createElement('div');
 el.className = 'addbar';
 el.innerHTML = `
 <div class="check">✓</div>
 <img class="thumb" alt="item">
 <div class="meta">
 <div class="title">Added to cart!</div>
 <div class="desc"></div>
 <div class="price-now"></div>
 </div>
 <div class="qty">
 <button class="step" data-act="dec">–</button>
 <span class="count">1</span>
 <button class="step" data-act="inc">+</button>
 </div>
 `;
 document.body.appendChild(el);
 return el;
 }

 async function showAddBar(item){
 const bar = ensureAddBar();
 const img = bar.querySelector('.thumb');
 const desc = bar.querySelector('.desc');
 const price = bar.querySelector('.price-now');
 const count = bar.querySelector('.count');

 img.src = item.image || '';
 img.alt = item.name;
 desc.textContent = item.name;
 price.textContent = `${money(item.price)} ea`;

 // set to current qty for this product
 const items = await db.list();
 const cur = items.find(i => i.product_id === item.product_id);
 count.textContent = String(cur ? Number(cur.qty||1) : 1);

 // stepper handlers
 bar.onclick = async (e) => {
 const b = e.target.closest('.step'); if (!b) return;
 const act = b.dataset.act;
 if (act === 'inc') {
 await db.changeQty(item.product_id, +1, item);
 count.textContent = String(Number(count.textContent) + 1);
 } else if (act === 'dec') {
 const next = Math.max(0, Number(count.textContent) - 1);
 await db.setQty(item.product_id, next, item);
 count.textContent = String(next);
 }
 await refreshBadge();
 // optional: re-render cart page if open
 maybeRenderCartPage();
 };

 bar.classList.add('show');
 clearTimeout(bar._t);
 bar._t = setTimeout(() => { bar.classList.remove('show'); }, 3500);
 }

 async function refreshBadge(){
 try {
 const qty = await db.countQty();
 const badge = $('#cart-count');
 if (badge) badge.textContent = qty;
 } catch {}
 }

 // ---------- Add-to-cart (uses product-level qty) ----------
 document.addEventListener('click', async (e)=>{
 const btn = e.target.closest('.add-to-cart');
 if (!btn) return;

 const item = {
 product_id: btn.dataset.id,
 name: btn.dataset.name,
 price: Number(btn.dataset.price),
 image: btn.dataset.img || null,
 qty: Number(btn.dataset.qty || 1)
 };

 if (!item.product_id || !item.name || Number.isNaN(item.price)) {
 showToast('Missing product data');
 console.error('Missing data on button:', btn.dataset);
 return;
 }

 try {
 await db.addOrInc(item);
 showAddBar(item);
 await refreshBadge();
 } catch (err) {
 console.error('Add error:', err);
 showToast('Could not add to cart ❌');
 }
 });

 // ---------- Cart page renderer + Place Order ----------
 async function maybeRenderCartPage(){
 const tbody = $('#cart-table-body');
 if (!tbody) { refreshBadge(); return; }

 try {
 const raw = await db.list();

 // aggregate by product_id (defensive if older duplicates exist)
 const map = new Map();
 for (const i of raw) {
 const key = i.product_id;
 if (!map.has(key)) {
 map.set(key, { ...i });
 } else {
 const r = map.get(key);
 r.qty = Number(r.qty||0) + Number(i.qty||1);
 }
 }
 const items = Array.from(map.values());

 tbody.innerHTML = items.map(i => `
 <tr>
 <td><img src="${i.image||''}" alt="${i.name}" class="cart-item-img"></td>
 <td class="cart-item-name">${i.name}</td>
 <td class="cart-item-price">${money(i.price)}</td>
 <td class="cart-item-qty">${i.qty}</td>
 <td class="cart-item-subtotal">${money(Number(i.price)*Number(i.qty))}</td>
 <td><button class="cart-remove" data-pid="${i.product_id}">Remove</button></td>
 </tr>
 `).join('');

 // total
 const total = items.reduce((s,i)=> s + Number(i.price)*Number(i.qty), 0);
 const totalEl = $('#cart-total'); if (totalEl) totalEl.textContent = money(total);

 // remove handler (remove whole product)
 tbody.addEventListener('click', async (e)=>{
 const rm = e.target.closest('.cart-remove'); if (!rm) return;
 const pid = rm.dataset.pid;
 try {
 await db.removeByPid(pid);
 maybeRenderCartPage();
 refreshBadge();
 } catch (err) {
 console.error('Remove error:', err);
 showToast('Remove failed ❌');
 }
 }, { once: true });

 // Place Order
 const po = $('#place-order');
 if (po) {
 po.onclick = async () => {
 const itemsNow = await db.list();
 if (!itemsNow.length) {
 showToast('Add something to cart first');
 setTimeout(()=> location.href = 'Product.html', 600); // capital P per your file
 return;
 }
 try {
 await db.clear();
 showToast('Order placed 🎉');
 await refreshBadge();
 maybeRenderCartPage();
 } catch (e) {
 console.error(e);
 showToast('Checkout failed ❌');
 }
 };
 }
 } catch (err) {
 console.error(err);
 showToast('Failed to load cart ❌');
 }
 }

 // ---------- Product gallery swap (safe no-op on other pages) ----------
 function wireGallery(){
 const main = $('#MainImg'); if (!main) return;
 $$('.small-img').forEach(img => img.addEventListener('click', ()=>{ main.src = img.src; }));
 }

 document.addEventListener('DOMContentLoaded', ()=>{
 console.log(useSupabase ? 'Cart mode: Supabase' : 'Cart mode: LocalStorage');
 wireGallery();
 refreshBadge();
 maybeRenderCartPage();
 });
})();
