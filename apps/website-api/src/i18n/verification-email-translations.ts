type SupportedLanguage = "en" | "fr" | "es" | "pt" | "it" | "de";

const emailTranslations = {
  en: {
    verifySubject: "Verify your Moorly account",
    eyebrow: "Moorly",
    title: "Verify your account",
    line1: "Thank you for creating your Moorly account.",
    line2: "Please click the button below to verify your email address and activate your account.",
    button: "Verify account",
    fallback: "If the button does not work, copy and paste this link into your browser:",
  },
  fr: {
    verifySubject: "Vérifiez votre compte Moorly",
    eyebrow: "Moorly",
    title: "Vérifiez votre compte",
    line1: "Merci d’avoir créé votre compte Moorly.",
    line2: "Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.",
    button: "Vérifier le compte",
    fallback: "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
  },
  es: {
    verifySubject: "Verifica tu cuenta Moorly",
    eyebrow: "Moorly",
    title: "Verifica tu cuenta",
    line1: "Gracias por crear tu cuenta Moorly.",
    line2: "Haz clic en el botón de abajo para verificar tu correo electrónico y activar tu cuenta.",
    button: "Verificar cuenta",
    fallback: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
  },
  pt: {
    verifySubject: "Verifique a sua conta Moorly",
    eyebrow: "Moorly",
    title: "Verifique a sua conta",
    line1: "Obrigado por criar a sua conta Moorly.",
    line2: "Clique no botão abaixo para verificar o seu email e ativar a sua conta.",
    button: "Verificar conta",
    fallback: "Se o botão não funcionar, copie e cole este link no seu navegador:",
  },
  it: {
    verifySubject: "Verifica il tuo account Moorly",
    eyebrow: "Moorly",
    title: "Verifica il tuo account",
    line1: "Grazie per aver creato il tuo account Moorly.",
    line2: "Clicca sul pulsante qui sotto per verificare il tuo indirizzo email e attivare il tuo account.",
    button: "Verifica account",
    fallback: "Se il pulsante non funziona, copia e incolla questo link nel browser:",
  },
  de: {
    verifySubject: "Bestätigen Sie Ihr Moorly-Konto",
    eyebrow: "Moorly",
    title: "Konto bestätigen",
    line1: "Vielen Dank, dass Sie Ihr Moorly-Konto erstellt haben.",
    line2: "Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen und Ihr Konto zu aktivieren.",
    button: "Konto bestätigen",
    fallback: "Wenn die Schaltfläche nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:",
  },
};

export function getVerificationEmailTranslation(language?: string) {
  const normalized = (language || "en").toLowerCase() as SupportedLanguage;
  return emailTranslations[normalized] || emailTranslations.en;
}