import Link from "next/link";
import { Suspense } from "react";
import { ThankfulBackButton, ThankfulGreeting } from "@/components/ThankfulInteractions";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";

const thankfulCopy: Record<Locale, {
  greeting: string;
  generic: string;
  received: string;
  submitted: string;
  followUp: string;
  adventure: string;
  home: string;
  back: string;
}> = {
  en: {
    greeting: "Thank You Mr. {name}", generic: "Thank You",
    received: "Your Request Has Been Received.",
    submitted: "Your Details Have Been Successfully Submitted And Confirmed.",
    followUp: "Our Team Will Reach Out To You Within 1 Hour Via WhatsApp, Phone Call, Or Email To Provide All The Details You Need.",
    adventure: "Get Ready — Your Adventure With Sun Pyramids Tours Starts Here!",
    home: "Home", back: "Go Back",
  },
  fr: {
    greeting: "Merci Monsieur {name}", generic: "Merci",
    received: "Votre Demande a Bien Été Reçue.",
    submitted: "Vos détails ont été soumis et confirmés avec succès.",
    followUp: "Notre équipe vous contactera dans 1 heure par WhatsApp, appel téléphonique ou e-mail pour vous fournir tous les détails dont vous avez besoin.",
    adventure: "Préparez-vous — votre aventure avec Sun Pyramids Tours commence ici !",
    home: "Accueil", back: "Retour",
  },
  de: {
    greeting: "Vielen Dank, Herr/Frau {name}", generic: "Vielen Dank",
    received: "Ihre Anfrage wurde empfangen.",
    submitted: "Ihre Details wurden erfolgreich übermittelt und bestätigt.",
    followUp: "Unser Team wird sich innerhalb einer Stunde per WhatsApp, Telefonanruf oder E-Mail bei Ihnen melden, um alle notwendigen Details zu besprechen.",
    adventure: "Machen Sie sich bereit — Ihr Abenteuer mit Sun Pyramids Tours beginnt hier!",
    home: "Startseite", back: "Zurück",
  },
  it: {
    greeting: "Grazie Signor {name}", generic: "Grazie",
    received: "La Sua Richiesta È Stata Ricevuta.",
    submitted: "I suoi dati sono stati inviati e confermati con successo.",
    followUp: "Il nostro team la contatterà entro 1 ora tramite WhatsApp, telefono o email per fornirle tutti i dettagli di cui ha bisogno.",
    adventure: "Si prepari — la sua avventura con Sun Pyramids Tours inizia qui!",
    home: "Home", back: "Indietro",
  },
  pt: {
    greeting: "Obrigado Senhor {name}", generic: "Obrigado",
    received: "O Seu Pedido Foi Recebido.",
    submitted: "Os seus dados foram enviados e confirmados com sucesso.",
    followUp: "A nossa equipa entrará em contacto consigo dentro de 1 hora via WhatsApp, chamada telefónica ou e-mail para fornecer todos os detalhes de que precisa.",
    adventure: "Prepare-se — a sua aventura com a Sun Pyramids Tours começa aqui!",
    home: "Início", back: "Voltar",
  },
  es: {
    greeting: "Gracias Señor {name}", generic: "Gracias",
    received: "Su Solicitud Ha Sido Recibida.",
    submitted: "Sus datos han sido enviados y confirmados exitosamente.",
    followUp: "Nuestro equipo se comunicará con usted dentro de 1 hora por WhatsApp, llamada telefónica o correo electrónico para proporcionarle todos los detalles que necesita.",
    adventure: "Prepárese — ¡su aventura con Sun Pyramids Tours comienza aquí!",
    home: "Inicio", back: "Volver",
  },
  zh: {
    greeting: "谢谢 {name} 先生", generic: "谢谢",
    received: "我们已收到您的请求。",
    submitted: "您的详细信息已成功提交并确认。",
    followUp: "我们的团队将在1小时内通过WhatsApp、电话或电子邮件与您联系，为您提供所需的所有详细信息。",
    adventure: "准备好——您在Sun Pyramids Tours的冒险之旅从这里开始！",
    home: "首页", back: "返回",
  },
};

export function ThankfulPage({ locale = "en" }: { locale?: Locale }) {
  const copy = thankfulCopy[locale];
  const homeHref = withLocale("/", locale);

  return (
    <main className="thankful-page">
      <section className="thankful-content" aria-labelledby="thankful-title">
        <svg className="thankful-mark" viewBox="0 0 144 144" role="img" aria-label="Request received">
          <path className="thankful-sparkle" d="M72 3 75 10 82 13 75 16 72 23 69 16 62 13 69 10Z" />
          <path className="thankful-sparkle" d="M128 74 130 80 136 82 130 84 128 90 126 84 120 82 126 80Z" />
          <path className="thankful-sparkle" d="M14 48 16 52 20 54 16 56 14 60 12 56 8 54 12 52Z" />
          <path className="thankful-seal" d="M119.3 87.5c-2.1 6.4 5.3 17.7 1.4 23.1-3.9 5.4-16.9 1.9-22.3 5.8-5.3 3.9-6 17.4-12.4 19.5-6.2 2-14.6-8.5-21.4-8.5s-15.2 10.5-21.4 8.5c-6.4-2.1-7-15.6-12.4-19.5-5.4-3.9-18.4-.4-22.3-5.8-3.9-5.3 3.5-16.6 1.4-23.1C12.6 81.2 0 76.4 0 69.5s12.6-11.7 14.6-17.9c2.1-6.4-5.3-17.7-1.4-23.1 3.9-5.4 16.9-1.9 22.3-5.8 5.3-3.9 6-17.4 12.4-19.5 6.2-2 14.6 8.5 21.4 8.5s15.2-10.5 21.4-8.5c6.4 2.1 7 15.6 12.4 19.5 5.4 3.9 18.4.4 22.3 5.8 3.9 5.3-3.5 16.6-1.4 23.1 2 6.2 14.6 11 14.6 17.9s-12.6 11.7-14.6 18Z" transform="translate(18 17) scale(.77)" />
          <path className="thankful-check" d="m51 72 15 15 29-31" />
        </svg>
        <div id="thankful-title">
          <Suspense fallback={<h1>{copy.generic}</h1>}>
            <ThankfulGreeting template={copy.greeting} fallback={copy.generic} />
          </Suspense>
        </div>
        <div className="thankful-message">
          <p>{copy.received}</p>
          <p>{copy.submitted}</p>
          <p>{copy.followUp}</p>
          <p>{copy.adventure}</p>
        </div>
        <div className="thankful-actions">
          <Link className="thankful-action" href={homeHref}>{copy.home}</Link>
          <ThankfulBackButton label={copy.back} homeHref={homeHref} />
        </div>
      </section>
    </main>
  );
}
