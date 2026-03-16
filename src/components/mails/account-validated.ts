interface AccountValidatedEmailData {
    prenom: string;
    email: string;
    loginUrl: string;
    emailSupport: string;
}

export function generateAccountValidatedEmailHtml({
    prenom,
    email,
    loginUrl,
    emailSupport,
}: AccountValidatedEmailData): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre compte bénévole est activé</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .check-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .check-icon svg { width: 40px; height: 40px; fill: white; }
        .header h1 { color: white; font-size: 28px; font-weight: 700; margin-bottom: 10px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #2d3748; margin-bottom: 24px; font-weight: 600; }
        .message { font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 35px; }
        .login-button {
            display: block;
            width: fit-content;
            margin: 0 auto 35px;
            padding: 16px 32px;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(72,187,120,0.3);
        }
        .info-box {
            background: #f0fff4;
            border-left: 4px solid #48bb78;
            padding: 20px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 30px;
        }
        .info-box h3 { color: #2d3748; font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .info-box p { color: #4a5568; font-size: 14px; line-height: 1.5; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 30px 0; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; line-height: 1.5; margin-bottom: 10px; }
        .footer .company { font-weight: 600; color: #2d3748; }
        @media (max-width: 600px) {
            .header, .content, .footer { padding: 30px 20px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="check-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                </svg>
            </div>
            <h1>Compte activé !</h1>
            <p>Bienvenue dans l'équipe des bénévoles</p>
        </div>

        <div class="content">
            <div class="greeting">Bonjour ${prenom},</div>

            <div class="message">
                Bonne nouvelle ! Votre compte bénévole associé à l'adresse <strong>${email}</strong> vient d'être validé par notre équipe.
                <br><br>
                Vous pouvez dès maintenant vous connecter et consulter les missions disponibles.
            </div>

            <a href="${loginUrl}" class="login-button">Accéder à mon espace bénévole</a>

            <div class="info-box">
                <h3>Que faire maintenant ?</h3>
                <p>
                    Connectez-vous avec votre adresse email et le mot de passe que vous avez choisi lors de votre inscription.
                    Vous pourrez ensuite parcourir les missions et vous inscrire à celles qui vous intéressent.
                </p>
            </div>

            <div class="divider"></div>

            <p style="color: #718096; font-size: 14px; line-height: 1.5;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <span style="word-break: break-all; color: #48bb78;">${loginUrl}</span>
            </p>
        </div>

        <div class="footer">
            <p class="company">Sheva</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>Des questions ? Contactez-nous à <a href="mailto:${emailSupport}" style="color: #48bb78;">${emailSupport}</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
