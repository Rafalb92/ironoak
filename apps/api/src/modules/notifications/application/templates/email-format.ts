const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Everything that came from a user (names, addresses) goes through this. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]!);
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency: string): string {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(cents / 100);
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** Brand frame shared by every email: inline styles, table layout — what email clients understand. */
export function emailLayout(preheader: string, content: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Helvetica,Arial,sans-serif;color:#1c1b19;">
  <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;">
        <tr><td style="padding:32px 32px 0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">IronOAK</td></tr>
        <tr><td style="padding:24px 32px 32px;font-size:15px;line-height:1.6;">${content}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#7a766d;">IRONOAK is a portfolio demo shop. No real orders are fulfilled.</p>
    </td></tr>
  </table>
</body>
</html>`;
}
