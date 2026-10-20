import type { OrderForEmail } from '../ports/order-reader.port';
import {
  countryName,
  emailLayout,
  escapeHtml,
  formatMoney,
  shortOrderId,
} from './email-format';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function addressLines(order: OrderForEmail): string[] {
  const a = order.address;
  const apartment = a.apartmentNumber ? `/${a.apartmentNumber}` : '';
  return [
    ...(a.recipientName ? [a.recipientName] : []),
    `${a.street} ${a.buildingNumber}${apartment}`,
    `${a.postalCode} ${a.city}, ${countryName(a.country)}`,
    ...(a.phone ? [a.phone] : []),
  ];
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:8px;padding:12px 24px;border-radius:9999px;background:#1c1b19;color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>`;
}

function summaryTable(order: OrderForEmail): string {
  const money = (cents: number) => formatMoney(cents, order.currency);
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? 'font-weight:700;' : ''}">${label}</td><td align="right" style="padding:6px 0;${strong ? 'font-weight:700;' : ''}">${value}</td></tr>`;

  const lines = order.lines
    .map((line) =>
      row(
        `${escapeHtml(line.productName)} × ${line.quantity}`,
        money(line.lineTotal),
      ),
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e6e2d8;border-bottom:1px solid #e6e2d8;">
    ${lines}
    <tr><td colspan="2" style="border-top:1px solid #e6e2d8;"></td></tr>
    ${row('Subtotal', money(order.subtotalAmount))}
    ${row(escapeHtml(order.shippingName), order.shippingAmount === 0 ? 'Free' : money(order.shippingAmount))}
    ${row('Total', money(order.totalAmount), true)}
  </table>`;
}

function summaryText(order: OrderForEmail): string {
  const money = (cents: number) => formatMoney(cents, order.currency);
  return [
    ...order.lines.map(
      (line) =>
        `${line.productName} x ${line.quantity}: ${money(line.lineTotal)}`,
    ),
    `Subtotal: ${money(order.subtotalAmount)}`,
    `${order.shippingName}: ${order.shippingAmount === 0 ? 'Free' : money(order.shippingAmount)}`,
    `Total: ${money(order.totalAmount)}`,
  ].join('\n');
}

export function orderConfirmedEmail(
  order: OrderForEmail,
  orderUrl: string,
): RenderedEmail {
  const number = shortOrderId(order.id);
  const address = addressLines(order);

  return {
    subject: `Order ${number} confirmed`,
    html: emailLayout(
      `We've received your payment for order ${number}.`,
      `<h1 style="margin:0 0 8px;font-size:24px;">Thank you — your order is confirmed.</h1>
       <p style="margin:0;color:#4d4a44;">Order ${number}. We're preparing it now and will email you when it ships.</p>
       ${summaryTable(order)}
       <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#7a766d;">Delivering to</p>
       <p style="margin:0 0 16px;">${address.map(escapeHtml).join('<br>')}</p>
       ${button(orderUrl, 'View your order')}`,
    ),
    text: [
      `Thank you — your order ${number} is confirmed.`,
      '',
      summaryText(order),
      '',
      'Delivering to:',
      ...address,
      '',
      `View your order: ${orderUrl}`,
    ].join('\n'),
  };
}

export function orderShippedEmail(
  order: OrderForEmail,
  orderUrl: string,
): RenderedEmail {
  const number = shortOrderId(order.id);

  return {
    subject: `Order ${number} is on its way`,
    html: emailLayout(
      `Order ${number} has left our workshop.`,
      `<h1 style="margin:0 0 8px;font-size:24px;">Your order is on its way.</h1>
       <p style="margin:0 0 16px;color:#4d4a44;">Order ${number} has left our workshop with ${escapeHtml(order.shippingName.toLowerCase())}. The delivery crew will call ${order.address.phone ? escapeHtml(order.address.phone) : 'you'} to arrange a time.</p>
       ${button(orderUrl, 'View your order')}`,
    ),
    text: [
      `Your order ${number} is on its way (${order.shippingName}).`,
      'The delivery crew will call you to arrange a time.',
      '',
      `View your order: ${orderUrl}`,
    ].join('\n'),
  };
}

/** Internal reasons ("Out of stock: <variant id>") never reach the customer verbatim. */
function customerFacingReason(reason: string): string {
  return reason.startsWith('Out of stock')
    ? 'An item in your order went out of stock before we could reserve it. You have not been charged for it.'
    : 'Your order has been cancelled as requested.';
}

export function orderCancelledEmail(
  order: OrderForEmail,
  reason: string,
  shopUrl: string,
): RenderedEmail {
  const number = shortOrderId(order.id);
  const explanation = customerFacingReason(reason);

  return {
    subject: `Order ${number} cancelled`,
    html: emailLayout(
      `Order ${number} has been cancelled.`,
      `<h1 style="margin:0 0 8px;font-size:24px;">Your order has been cancelled.</h1>
       <p style="margin:0 0 16px;color:#4d4a44;">Order ${number}. ${escapeHtml(explanation)}</p>
       ${button(shopUrl, 'Continue shopping')}`,
    ),
    text: [
      `Your order ${number} has been cancelled.`,
      explanation,
      '',
      `Continue shopping: ${shopUrl}`,
    ].join('\n'),
  };
}
