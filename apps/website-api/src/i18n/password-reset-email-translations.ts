type SupportedLanguage =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "it"
  | "de";

type PasswordResetEmailTranslation = {
  subject: string;
  eyebrow: string;
  title: string;
  line1: string;
  line2: string;
  button: string;
  fallback: string;
  expiry: string;
  ignore: string;
};

const translations: Record<
  SupportedLanguage,
  PasswordResetEmailTranslation
> = {
  en: {
    subject: "Reset your Moorish Concierge password",
    eyebrow: "Password reset",
    title: "Create a new password",
    line1:
      "We received a request to reset the password for your Moorish Concierge account.",
    line2:
      "Use the button below to choose a new password.",
    button: "Reset my password",
    fallback:
      "If the button does not work, copy and paste the following link into your browser:",
    expiry:
      "This link will expire in 30 minutes.",
    ignore:
      "If you did not request a password reset, you can ignore this email.",
  },

  fr: {
    subject:
      "Réinitialisez votre mot de passe Moorish Concierge",
    eyebrow: "Réinitialisation du mot de passe",
    title: "Créez un nouveau mot de passe",
    line1:
      "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Moorish Concierge.",
    line2:
      "Utilisez le bouton ci-dessous pour choisir un nouveau mot de passe.",
    button: "Réinitialiser mon mot de passe",
    fallback:
      "Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :",
    expiry:
      "Ce lien expirera dans 30 minutes.",
    ignore:
      "Si vous n’avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.",
  },

  es: {
    subject:
      "Restablece tu contraseña de Moorish Concierge",
    eyebrow: "Restablecimiento de contraseña",
    title: "Crea una nueva contraseña",
    line1:
      "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Moorish Concierge.",
    line2:
      "Utiliza el botón siguiente para elegir una nueva contraseña.",
    button: "Restablecer mi contraseña",
    fallback:
      "Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:",
    expiry:
      "Este enlace caducará en 30 minutos.",
    ignore:
      "Si no solicitaste este cambio, puedes ignorar este correo.",
  },

  pt: {
    subject:
      "Redefina a sua palavra-passe da Moorish Concierge",
    eyebrow: "Redefinição da palavra-passe",
    title: "Crie uma nova palavra-passe",
    line1:
      "Recebemos um pedido para redefinir a palavra-passe da sua conta Moorish Concierge.",
    line2:
      "Utilize o botão abaixo para escolher uma nova palavra-passe.",
    button: "Redefinir a palavra-passe",
    fallback:
      "Se o botão não funcionar, copie e cole o seguinte link no navegador:",
    expiry:
      "Este link expira dentro de 30 minutos.",
    ignore:
      "Se não solicitou esta alteração, pode ignorar este e-mail.",
  },

  it: {
    subject:
      "Reimposta la password di Moorish Concierge",
    eyebrow: "Reimpostazione password",
    title: "Crea una nuova password",
    line1:
      "Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Moorish Concierge.",
    line2:
      "Usa il pulsante qui sotto per scegliere una nuova password.",
    button: "Reimposta la password",
    fallback:
      "Se il pulsante non funziona, copia e incolla il seguente link nel browser:",
    expiry:
      "Questo link scadrà tra 30 minuti.",
    ignore:
      "Se non hai richiesto questa modifica, puoi ignorare questa e-mail.",
  },

  de: {
    subject:
      "Setzen Sie Ihr Moorish-Concierge-Passwort zurück",
    eyebrow: "Passwort zurücksetzen",
    title: "Neues Passwort erstellen",
    line1:
      "Wir haben eine Anfrage zum Zurücksetzen des Passworts Ihres Moorish-Concierge-Kontos erhalten.",
    line2:
      "Verwenden Sie die Schaltfläche unten, um ein neues Passwort festzulegen.",
    button: "Passwort zurücksetzen",
    fallback:
      "Falls die Schaltfläche nicht funktioniert, kopieren Sie den folgenden Link in Ihren Browser:",
    expiry:
      "Dieser Link läuft in 30 Minuten ab.",
    ignore:
      "Falls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.",
  },
};

function normalizeLanguage(
  language?: string
): SupportedLanguage {
  const value = (
    language || "en"
  ).toLowerCase();

  if (
    value === "en" ||
    value === "fr" ||
    value === "es" ||
    value === "pt" ||
    value === "it" ||
    value === "de"
  ) {
    return value;
  }

  return "en";
}

export function getPasswordResetEmailTranslation(
  language?: string
) {
  return translations[
    normalizeLanguage(language)
  ];
}