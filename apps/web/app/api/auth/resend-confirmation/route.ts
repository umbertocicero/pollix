import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function buildEmailHtml(confirmationUrl: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Conferma email – Pollix</title>
</head>
<body style="margin:0;padding:0;background-color:#1E293B;font-family:'Courier New',Courier,monospace;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="100%" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#3D8FD6;border-top:4px solid #5AABF0;border-left:4px solid #5AABF0;border-right:4px solid #1A5FA0;border-bottom:4px solid #1A5FA0;padding:10px 28px;">
                  <span style="font-size:22px;font-weight:bold;color:#FFFFFF;letter-spacing:4px;font-family:'Courier New',Courier,monospace;">POLLIX</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F5EB;border-top:4px solid #E0E0D0;border-left:4px solid #E0E0D0;border-right:4px solid #4A4A4A;border-bottom:4px solid #4A4A4A;padding:36px 40px;">
            <h1 style="margin:0 0 8px;font-size:17px;font-family:'Courier New',Courier,monospace;color:#1A1A1A;letter-spacing:1px;">
              Conferma la tua email
            </h1>
            <p style="margin:0 0 24px;font-size:14px;font-family:Georgia,serif;color:#555555;line-height:1.65;">
              Grazie per esserti registrato su <strong>Pollix</strong>!<br>
              Clicca il pulsante qui sotto per verificare il tuo indirizzo email e completare la registrazione.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#5D8A3A;border-top:4px solid #8BC34A;border-left:4px solid #8BC34A;border-right:4px solid #2E5A1A;border-bottom:4px solid #2E5A1A;">
                  <a href="${confirmationUrl}" style="display:block;padding:14px 36px;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:bold;color:#FFFFFF;text-decoration:none;letter-spacing:2px;">
                    &#10004; CONFERMA EMAIL
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:11px;font-family:'Courier New',Courier,monospace;color:#888888;line-height:1.6;">
              Se il pulsante non funziona, copia questo link nel browser:<br>
              <a href="${confirmationUrl}" style="color:#3D8FD6;word-break:break-all;">${confirmationUrl}</a>
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
              <tr><td height="2" style="background:#CCCCCC;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
            <p style="margin:16px 0 0;font-size:11px;font-family:Georgia,serif;color:#AAAAAA;line-height:1.5;">
              Se non hai creato un account su Pollix, ignora questa email.<br>
              Il link scade entro 24 ore.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 0 0;">
            <p style="margin:0;font-size:11px;font-family:'Courier New',Courier,monospace;color:#8899AA;">
              &copy; Pollix &nbsp;&middot;&nbsp;
              <a href="${siteUrl}" style="color:#3D8FD6;text-decoration:none;">pollix.it</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json({ error: 'email_required' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pollix.it';

  if (!serviceRoleKey || !resendApiKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY');
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Generate a fresh signup confirmation link via admin API.
  // This creates a valid token even if the previous one expired.
  // 'magiclink' generates a valid OTP link for an existing unconfirmed user.
  // Clicking it logs them in and confirms their email in one step.
  const { data, error: genError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (genError || !data?.properties?.action_link) {
    console.error('generateLink error:', genError?.message);
    // Return generic success to avoid leaking whether the email exists.
    return NextResponse.json({ success: true });
  }

  const confirmationUrl = data.properties.action_link;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pollix <noreply@pollix.it>',
      to: [email],
      subject: 'Conferma la tua email – Pollix',
      html: buildEmailHtml(confirmationUrl, siteUrl),
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}));
    console.error('Resend send error:', err);
    return NextResponse.json({ error: 'email_send_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
