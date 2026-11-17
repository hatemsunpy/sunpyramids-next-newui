import { ArrowUpRight, Banknote, CalendarDays, Clock, Droplet, FileCheck, Landmark, Languages, ShieldCheck, Shirt, Wallet } from "lucide-react";
import { egyptEssentialsCopy } from "@/components/egypt-essentials-copy";
import styles from "@/styles/egypt-essentials.module.scss";
import type { Locale } from "@/types/api";

const visaPortal = "https://visa2egypt.gov.eg/eVisa/Home";
const visitorInformation = "https://www.experienceegypt.eg/en/usefulinfo";

const factCards = [
  [Landmark],
  [Banknote],
  [FileCheck, visaPortal],
  [CalendarDays],
  [Languages],
  [Clock],
] as const;
const tipIcons = [Shirt, Wallet, Droplet, ShieldCheck] as const;

export function EgyptEssentials({ locale }: { locale: Locale }) {
  const copy = egyptEssentialsCopy[locale];

  return (
    <section id="egypt-essentials" className={styles.section} aria-labelledby="egypt-essentials-heading">
      <div className={styles.shell}>
        <header className={styles.heading}>
          <h2 id="egypt-essentials-heading">{copy.title}</h2>
          <p>{copy.intro}</p>
        </header>

        <dl className={styles.facts}>
          {copy.facts.map(([label, value, detail], index) => {
            const [Icon, href] = factCards[index];
            return (
              <div className={styles.fact} key={label}>
                <dt><Icon aria-hidden="true" size={17} />{label}</dt>
                <dd>
                  <strong>{value}</strong>
                  <p>{detail}</p>
                  {href && (
                    <a href={href}>{copy.visaLink}<ArrowUpRight aria-hidden="true" size={14} /></a>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        <ul className={styles.tips} role="list">
          {copy.tips.map(([label, detail], index) => {
            const Icon = tipIcons[index];
            return (
              <li key={label}>
                <h3><Icon aria-hidden="true" size={17} />{label}</h3>
                <p>{detail}</p>
              </li>
            );
          })}
        </ul>
        <a className={styles.visitorLink} href={visitorInformation}>
          {copy.visitorInfoLink}<ArrowUpRight aria-hidden="true" size={14} />
        </a>
      </div>
    </section>
  );
}
