require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const STORE_ID = process.env.NUVEMSHOP_STORE_ID;
const ACCESS_TOKEN = process.env.NUVEMSHOP_ACCESS_TOKEN;
const BASE_URL = `https://api.tiendanube.com/v1/${STORE_ID}`;
const HEADERS = {
    'Authentication': `bearer ${ACCESS_TOKEN}`,
    'User-Agent': 'Dezoito K Dashboard (dezoitoktijoux@gmail.com)'
};

function getSupabase() {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function extractName(nameObj) {
    if (typeof nameObj === 'object') return nameObj.pt || nameObj.es || nameObj.en || Object.values(nameObj)[0] || '';
    return nameObj || '';
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim().substring(0, 500);
}

async function getSalesRanking() {
    const supabase = getSupabase();
    const since = new Date();
    since.setDate(since.getDate() - 90);

    let all = [];
    let from = 0;
    while (true) {
        const { data } = await supabase
            .from('dezoito_orders')
            .select('product_name, quantity_buyed')
            .gte('created_at', since.toISOString())
            .eq('payment_status', 'paid')
            .range(from, from + 999);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    const sales = {};
    all.forEach(o => {
        const names = (o.product_name || '').split(', ');
        const qtys = (o.quantity_buyed || '1').toString().split(', ');
        names.forEach((name, i) => {
            if (!name.trim()) return;
            const qty = parseInt(qtys[i]) || 1;
            const clean = name.trim().toLowerCase();
            sales[clean] = (sales[clean] || 0) + qty;
        });
    });

    return sales;
}

async function fetchAllProducts() {
    let page = 1;
    let all = [];

    console.log('📦 Fetching products from Nuvemshop...');
    while (true) {
        const { data } = await axios.get(`${BASE_URL}/products`, {
            headers: HEADERS,
            params: { page, per_page: 200, published: true }
        });
        if (!data || data.length === 0) break;
        all = all.concat(data);
        console.log(`  Page ${page}: ${data.length} products (total: ${all.length})`);
        if (data.length < 200) break;
        page++;
    }
    return all;
}

function mapProduct(product, salesMap) {
    const name = extractName(product.name);
    const description = stripHtml(extractName(product.description));
    const handle = extractName(product.handle);
    const mainImage = product.images?.[0]?.src || null;
    const canonicalUrl = product.canonical_url || `https://www.dezoitokjoias.com.br/produtos/${handle}/`;

    // Categories
    const categories = (product.categories || [])
        .map(c => extractName(c.name).trim())
        .filter(c => c)
        .join(', ');

    // Get price range and total stock from variants
    const variants = product.variants || [];
    const prices = variants.map(v => parseFloat(v.price) || 0).filter(p => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    // Variant names (sizes, etc.)
    const variantNames = variants
        .map(v => {
            if (v.values && v.values.length > 0) {
                return v.values.map(val => extractName(val)).join(' / ');
            }
            return null;
        })
        .filter(Boolean)
        .join(', ');

    // Match sales - try matching product name against sales keys
    const nameLower = name.toLowerCase();
    let totalSold = 0;
    for (const [key, qty] of Object.entries(salesMap)) {
        if (key.includes(nameLower) || nameLower.includes(key)) {
            totalSold += qty;
        }
    }
    // Also check variant-level matches
    variants.forEach(v => {
        const variantName = (name + ' (' + (v.values?.map(val => extractName(val)).join('/') || '') + ')').toLowerCase();
        for (const [key, qty] of Object.entries(salesMap)) {
            if (key === variantName) {
                totalSold += qty;
            }
        }
    });

    return {
        nuvemshop_id: String(product.id),
        name,
        description,
        handle,
        canonical_url: canonicalUrl,
        image_url: mainImage,
        categories,
        price_min: minPrice,
        price_max: maxPrice,
        total_stock: totalStock,
        variants: variantNames,
        tags: product.tags || '',
        total_sold_90d: totalSold,
        published: product.published || false,
        created_at: product.created_at || null,
        updated_at: product.updated_at || null
    };
}

async function syncProducts() {
    if (!STORE_ID || !ACCESS_TOKEN) {
        console.warn('⚠️ NUVEMSHOP credentials not configured');
        return;
    }

    const supabase = getSupabase();

    // Get sales ranking
    console.log('📊 Calculating sales ranking (last 90 days)...');
    const salesMap = await getSalesRanking();

    // Fetch all published products
    const products = await fetchAllProducts();
    console.log(`\n📦 Total published products: ${products.length}`);

    // Map and upsert
    const mapped = products.map(p => mapProduct(p, salesMap));

    // Sort by sales for logging
    const topSellers = [...mapped].sort((a, b) => b.total_sold_90d - a.total_sold_90d).slice(0, 10);
    console.log('\n🏆 Top 10 mais vendidos:');
    topSellers.forEach((p, i) => {
        console.log(`  ${i + 1}. (${p.total_sold_90d}x) ${p.name} - R$${p.price_min}`);
    });

    // Upsert in batches of 100
    let synced = 0;
    for (let i = 0; i < mapped.length; i += 100) {
        const batch = mapped.slice(i, i + 100);
        const { error } = await supabase
            .from('dezoito_products')
            .upsert(batch, { onConflict: 'nuvemshop_id' });

        if (error) {
            console.error('❌ Supabase error:', error.message);
        } else {
            synced += batch.length;
        }
    }

    console.log(`\n✅ Products synced: ${synced}`);
}

module.exports = { syncProducts, fetchAllProducts, mapProduct, getSalesRanking };

// Run directly
if (require.main === module) {
    syncProducts().catch(console.error);
}
