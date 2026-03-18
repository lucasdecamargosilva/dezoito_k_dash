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
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
}

// --- Mappers ---

function mapOrder(order) {
    const customer = order.customer || {};
    const products = order.products || [];
    const payment = order.payment_details || {};

    const productName = products.map(p => {
        const name = p.name;
        if (typeof name === 'object') return name.pt || name.es || name.en || Object.values(name)[0] || '';
        return name || '';
    }).join(', ');
    const productPrice = products.map(p => p.price || '0').join(', ');
    const quantityBuyed = products.map(p => p.quantity || 1).join(', ');

    return {
        id_pedido: order.id,
        order_number: order.number || null,
        nuvemshop_id: String(order.id),
        customer_id: customer.id || null,
        customer_name: customer.name || order.contact_name || '',
        customer_email: order.contact_email || customer.email || '',
        customer_phone: order.contact_phone || '',
        contact_identification: order.contact_identification || '',
        status: order.status || '',
        payment_status: order.payment_status || '',
        shipping_status: order.shipping_status || '',
        created_at: order.created_at || null,
        updated_at: order.updated_at || null,
        completed_at: order.completed_at?.date || null,
        paid_at: order.paid_at || null,
        cancelled_at: order.cancelled_at || null,
        closed_at: order.closed_at || null,
        read_at: order.read_at || null,
        subtotal: parseFloat(order.subtotal) || 0,
        discount: parseFloat(order.discount) || 0,
        discount_coupon: order.discount_coupon || null,
        discount_gateway: parseFloat(order.discount_gateway) || 0,
        total: parseFloat(order.total) || 0,
        total_usd: parseFloat(order.total_usd) || 0,
        total_paid_by_customer: parseFloat(order.total_paid_by_customer) || null,
        currency: order.currency || 'BRL',
        gateway: order.gateway || '',
        gateway_name: order.gateway_name || '',
        gateway_id: order.gateway_id || '',
        gateway_link: order.gateway_link || null,
        payment_method: payment.method || '',
        payment_cc_company: payment.credit_card_company || null,
        payment_installments: payment.installments ? parseInt(payment.installments) : null,
        shipping_name: order.shipping_name || order.billing_name || '',
        shipping_phone: order.shipping_phone || '',
        shipping_address: typeof order.shipping_address === 'object' ? JSON.stringify(order.shipping_address) : (order.shipping_address || ''),
        shipping_number: order.shipping_number || '',
        shipping_floor: order.shipping_floor || '',
        shipping_locality: order.shipping_locality || '',
        shipping_zipcode: order.shipping_zipcode || '',
        shipping_city: order.shipping_address?.city || order.shipping_city || '',
        shipping_province: order.shipping_address?.province || order.shipping_province || '',
        shipping_country: order.shipping_address?.country || order.shipping_country || '',
        billing_name: order.billing_name || '',
        billing_phone: order.billing_phone || '',
        billing_address: order.billing_address || '',
        billing_number: order.billing_number || '',
        billing_floor: order.billing_floor || '',
        billing_locality: order.billing_locality || '',
        billing_zipcode: order.billing_zipcode || '',
        billing_city: order.billing_city || '',
        billing_province: order.billing_province || '',
        billing_country: order.billing_country || '',
        same_billing_and_shipping: order.same_billing_and_shipping_address || false,
        shipping_option_name: order.shipping_option || '',
        shipping_carrier_name: order.shipping_carrier_name || '',
        shipping_consumer_cost: parseFloat(order.shipping_cost_customer) || 0,
        shipping_merchant_cost: parseFloat(order.shipping_cost_owner) || 0,
        shipping_tracking_number: order.shipping_tracking_number || null,
        shipping_tracking_url: order.shipping_tracking_url || null,
        storefront: order.storefront || null,
        note: order.note || null,
        owner_note: order.owner_note || null,
        client_browser_ip: order.client_details?.browser_ip || null,
        client_user_agent: order.client_details?.user_agent || null,
        app_id: order.app_id || null,
        product_name: productName,
        product_price: productPrice,
        quantity_buyed: quantityBuyed
    };
}

function mapCheckout(checkout) {
    const payment = checkout.payment_details || {};
    const lineItems = checkout.products || [];
    const productName = lineItems.map(p => {
        const name = p.name;
        if (typeof name === 'object') return name.pt || name.es || name.en || Object.values(name)[0] || '';
        return name || '';
    }).filter(Boolean).join(', ');
    return {
        id: checkout.id,
        nuvemshop_id: String(checkout.id),
        product_name: productName || null,
        token: checkout.token || null,
        store_id: checkout.store_id || null,
        abandoned_checkout_url: checkout.abandoned_checkout_url || null,
        contact_email: checkout.contact_email || '',
        contact_name: checkout.contact_name || '',
        contact_phone: checkout.contact_phone || '',
        contact_identification: checkout.contact_identification || '',
        contact_accepts_marketing: checkout.contact_accepts_marketing || false,
        contact_accepts_marketing_updated_at: checkout.contact_accepts_marketing_updated_at || null,
        shipping_name: checkout.shipping_name || '',
        shipping_phone: checkout.shipping_phone || '',
        shipping_address: checkout.shipping_address || '',
        shipping_number: checkout.shipping_number || '',
        shipping_floor: checkout.shipping_floor || '',
        shipping_locality: checkout.shipping_locality || '',
        shipping_zipcode: checkout.shipping_zipcode || '',
        shipping_city: checkout.shipping_city || '',
        shipping_province: checkout.shipping_province || '',
        shipping_country: checkout.shipping_country || '',
        billing_name: checkout.billing_name || '',
        billing_phone: checkout.billing_phone || '',
        billing_address: checkout.billing_address || '',
        billing_number: checkout.billing_number || '',
        billing_floor: checkout.billing_floor || '',
        billing_locality: checkout.billing_locality || '',
        billing_zipcode: checkout.billing_zipcode || '',
        billing_city: checkout.billing_city || '',
        billing_province: checkout.billing_province || '',
        billing_country: checkout.billing_country || '',
        subtotal: parseFloat(checkout.subtotal) || 0,
        discount: parseFloat(checkout.discount) || 0,
        discount_coupon: parseFloat(checkout.discount_coupon) || null,
        discount_gateway: parseFloat(checkout.discount_gateway) || null,
        total: parseFloat(checkout.total) || 0,
        total_usd: parseFloat(checkout.total_usd) || null,
        currency: checkout.currency || 'BRL',
        weight: parseFloat(checkout.weight) || null,
        payment_status: checkout.payment_status || '',
        payment_method: payment.method || '',
        payment_installments: payment.installments ? parseInt(payment.installments) : null,
        payment_credit_card_company: payment.credit_card_company || null,
        gateway: checkout.gateway || '',
        gateway_name: checkout.gateway_name || '',
        checkout_enabled: checkout.checkout_enabled || false,
        checkout_bot_suspect: checkout.checkout_bot_suspect || false,
        has_stock_available: checkout.has_stock_available || null,
        was_notified: checkout.was_notified || false,
        language: checkout.language || '',
        storefront: checkout.storefront || null,
        same_billing_and_shipping_address: checkout.same_billing_and_shipping_address || false,
        utm_source: checkout.utm_source || null,
        utm_medium: checkout.utm_medium || null,
        utm_campaign: checkout.utm_campaign || null,
        utm_content: checkout.utm_content || null,
        utm_term: checkout.utm_term || null,
        landing_page: checkout.landing_page || null,
        customer_visit_created_at: checkout.customer_visit_created_at || null,
        created_at: checkout.created_at || null,
        updated_at: checkout.updated_at || null,
        completed_at: checkout.completed_at || null,
        owner_note: checkout.owner_note || null,
        order_origin: checkout.order_origin || null
    };
}

// --- Sync functions ---

async function syncOrders() {
    const supabase = getSupabase();
    let page = 1;
    let synced = 0;

    const since = new Date();
    since.setDate(since.getDate() - 30);

    console.log('🔄 [Nuvemshop] Syncing orders (last 30 days)...');
    while (true) {
        const { data } = await axios.get(`${BASE_URL}/orders`, {
            headers: HEADERS,
            params: { page, per_page: 200, created_at_min: since.toISOString() }
        });

        if (!data || data.length === 0) break;

        const mapped = data.map(mapOrder);
        const { error } = await supabase
            .from('dezoito_orders')
            .upsert(mapped, { onConflict: 'nuvemshop_id' });

        if (error) console.error('❌ Supabase orders error:', error.message);
        else synced += mapped.length;

        if (data.length < 200) break;
        page++;
    }
    console.log(`✅ [Nuvemshop] Orders synced: ${synced}`);
}

async function syncCheckouts() {
    const supabase = getSupabase();
    let page = 1;
    let synced = 0;

    const since = new Date();
    since.setDate(since.getDate() - 30);

    console.log('🔄 [Nuvemshop] Syncing abandoned checkouts (last 30 days)...');
    while (true) {
        const { data } = await axios.get(`${BASE_URL}/checkouts`, {
            headers: HEADERS,
            params: { page, per_page: 200, created_at_min: since.toISOString() }
        });

        if (!data || data.length === 0) break;

        const mapped = data.map(mapCheckout);
        const { error } = await supabase
            .from('abandoned_checkouts_dezoito')
            .upsert(mapped, { onConflict: 'nuvemshop_id' });

        if (error) console.error('❌ Supabase checkouts error:', error.message);
        else synced += mapped.length;

        if (data.length < 200) break;
        page++;
    }
    console.log(`✅ [Nuvemshop] Checkouts synced: ${synced}`);
}

// --- Webhook registration ---

async function registerWebhooks() {
    const N8N_URL = process.env.N8N_URL || 'https://n8n.segredosdodrop.com';
    const webhooks = [
        { event: 'order/created', url: `${N8N_URL}/webhook/nuvemshop-orders` },
        { event: 'order/updated', url: `${N8N_URL}/webhook/nuvemshop-orders` },
        { event: 'checkout/created', url: `${N8N_URL}/webhook/nuvemshop-checkouts` },
        { event: 'checkout/updated', url: `${N8N_URL}/webhook/nuvemshop-checkouts` }
    ];

    try {
        const { data: existing } = await axios.get(`${BASE_URL}/webhooks`, { headers: HEADERS });
        const existingSet = new Set((existing || []).map(w => `${w.event}|${w.url}`));

        for (const wh of webhooks) {
            if (existingSet.has(`${wh.event}|${wh.url}`)) {
                console.log(`ℹ️ [Nuvemshop] Webhook já existe: ${wh.event}`);
            } else {
                await axios.post(`${BASE_URL}/webhooks`, wh, { headers: HEADERS });
                console.log(`✅ [Nuvemshop] Webhook registrado: ${wh.event} → ${wh.url}`);
            }
        }
    } catch (err) {
        console.error('❌ [Nuvemshop] Erro ao registrar webhooks:', err.response?.data || err.message);
    }
}

// --- Startup sync ---

async function runStartupSync() {
    if (!STORE_ID || !ACCESS_TOKEN) {
        console.warn('⚠️ [Nuvemshop] NUVEMSHOP_STORE_ID ou ACCESS_TOKEN não configurados. Sync ignorado.');
        return;
    }
    try {
        await syncOrders();
        await syncCheckouts();
    } catch (err) {
        console.error('❌ [Nuvemshop] Erro no sync inicial:', err.message);
    }
}

module.exports = { runStartupSync, registerWebhooks, syncOrders, syncCheckouts, mapOrder, mapCheckout };
