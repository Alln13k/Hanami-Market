import { config } from '../config.js';

const API = 'https://api.nowpayments.io/v1';

// Vérifie que la clé API NowPayments est valide
export async function checkApiKey() {
  const res = await fetch(`${API}/status`, {
    headers: { 'x-api-key': config.nowpaymentsKey },
  });
  return res.ok;
}

// Crée un paiement Litecoin pour une commande.
// Retourne { paymentId, payAddress, payAmount, payCurrency } ou null.
export async function createLtcPayment({ orderId, amountUSD }) {
  if (!config.nowpaymentsKey) throw new Error('NOWPAYMENTS_API_KEY manquante');

  const body = {
    price_amount: Number(amountUSD),
    price_currency: 'usd',
    pay_currency: 'ltc',
    order_id: orderId,
    ipn_callback_url: `${config.panelUrl}/api/webhook/nowpayments`,
    is_fixed_rate: false,
    is_fee_paid_by_user: true,
  };

  const res = await fetch(`${API}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': config.nowpaymentsKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NowPayments erreur ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    paymentId: data.payment_id,
    payAddress: data.pay_address,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
  };
}

// Interroge le statut d'un paiement (fallback si le webhook n'arrive pas).
// Statuts possibles: waiting, confirming, confirmed, sending, finished, failed...
export async function getPaymentStatus(paymentId) {
  if (!paymentId) return null;
  const res = await fetch(`${API}/payment/${paymentId}`, {
    headers: { 'x-api-key': config.nowpaymentsKey },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.payment_status || null;
}

// Statuts considérés comme "payé"
export const PAID_STATUSES = ['confirmed', 'sending', 'finished'];

// Lien de paiement PayPal (paypal.me)
export function paypalLink(amountUSD) {
  return `https://www.paypal.me/${config.paypalMe}/${Number(amountUSD).toFixed(2)}`;
}

// Lien d'exploration de l'adresse Litecoin
export function ltcExplorer(address) {
  return `https://blockchair.com/litecoin/address/${address}`;
}