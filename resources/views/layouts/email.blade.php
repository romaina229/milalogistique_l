<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Milla Logistique')</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #333; }
        .wrapper { max-width: 600px; margin: 30px auto; }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
            padding: 30px 40px; border-radius: 12px 12px 0 0; text-align: center;
        }
        .header img { height: 50px; margin-bottom: 12px; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
        .header p  { color: #bfdbfe; font-size: 13px; margin-top: 4px; }
        .body { background: #fff; padding: 36px 40px; }
        .body h2 { font-size: 20px; color: #1e3a8a; margin-bottom: 16px; }
        .body p  { font-size: 15px; line-height: 1.7; color: #4b5563; margin-bottom: 14px; }
        .info-box {
            background: #eff6ff; border: 1px solid #bfdbfe;
            border-radius: 10px; padding: 20px 24px; margin: 24px 0;
        }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0;
            border-bottom: 1px solid #dbeafe; font-size: 14px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6b7280; }
        .info-value { color: #1e3a8a; font-weight: 600; }
        .btn {
            display: inline-block; background: #1d4ed8; color: #fff !important;
            padding: 14px 32px; border-radius: 8px; text-decoration: none;
            font-weight: 700; font-size: 15px; text-align: center; margin: 8px 0;
        }
        .btn:hover { background: #1e40af; }
        .footer {
            background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;
            padding: 24px 40px; border-radius: 0 0 12px 12px; text-align: center;
        }
        .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
        .footer a { color: #1d4ed8; text-decoration: none; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <img src="{{ asset('images/logomilla.jpeg') }}" alt="Milla Logistique" onerror="this.style.display='none'">
        <h1>Milla Logistique</h1>
        <p>Documents professionnels de logistique</p>
    </div>

    <div class="body">
        @yield('content')
    </div>

    <div class="footer">
        <p>
            © {{ date('Y') }} Milla Logistique — Cotonou, Bénin<br>
            📞 +229 01 52 75 56 08 &nbsp;|&nbsp; ✉️ <a href="mailto:milalogistique@gmail.com">milalogistique@gmail.com</a>
        </p>
        <p style="margin-top:8px; color:#d1d5db; font-size:11px;">
            Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre directement.
        </p>
    </div>
</div>
</body>
</html>
