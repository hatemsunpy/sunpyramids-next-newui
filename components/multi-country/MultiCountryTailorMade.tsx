import Link from "next/link";
import { ArrowUpRight, Clock3, Compass, Flag, MapPin, Plane, Route, Sparkles, Users } from "lucide-react";
import { homeCopy } from "@/lib/home-copy";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";
import { tailorMadeCopy } from "./tailor-made-copy";
import "@/styles/multi-country.scss";

export function MultiCountryTailorMade({ locale }: { locale: Locale }) {
  const labels = tailorMadeCopy(locale);
  const brandCopy = homeCopy(locale);
  return (
    <section className="mc-tailor mc-shell" aria-labelledby="mc-tailor-title">
      <div className="mc-tailor-panel">
        <div className="mc-tailor-copy">
          <p className="mc-tailor-eyebrow"><Sparkles size={15} aria-hidden="true" />{labels.eyebrow}</p>
          <h2 className="mc-tailor-title" id="mc-tailor-title">{labels.title}</h2>
          <p className="mc-tailor-lede">{labels.lede}</p>
          <ul className="mc-tailor-points">
            <li><Clock3 size={18} aria-hidden="true" />{brandCopy.whyTravelExperienceStat}</li>
            <li><Users size={18} aria-hidden="true" />{labels.localTeam}</li>
            <li><Route size={18} aria-hidden="true" />{labels.personalised}</li>
          </ul>
          <Link className="mc-primary mc-tailor-cta" href={withLocale("/make-your-trip", locale)}>
            {labels.cta}<ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
        <div className="mc-tailor-art" aria-hidden="true">
          <svg className="mc-tailor-flightpath" viewBox="0 0 480 330" fill="none" focusable="false">
            <path d="M18 265C-15 169 103 150 146 189S266 300 360 212 467 136 436 61" stroke="currentColor" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
            <circle cx="18" cy="265" r="7" fill="currentColor" />
          </svg>
          <div className="mc-tailor-map">
            <svg viewBox="0 0 360 290" fill="none" focusable="false">
              <g stroke="currentColor" strokeWidth="1">
                <path d="M-20 30C70 112 129-18 218 39S324 138 390 53M-20 49C72 131 125 1 217 58S324 157 390 72M-20 68C72 150 125 20 217 77S324 176 390 91M-20 87C72 169 125 39 217 96S324 195 390 110" />
                <path d="M-30 169C57 112 118 263 207 200S314 151 390 222M-30 188C57 131 118 282 207 219S314 170 390 241M-30 207C57 150 118 301 207 238S314 189 390 260M-30 226C57 169 118 320 207 257S314 208 390 279" />
              </g>
              <path d="M40 211Q90 92 157 145T306 63" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 7" />
              <circle cx="40" cy="211" r="7" fill="currentColor" /><circle cx="157" cy="145" r="7" fill="currentColor" /><circle cx="306" cy="63" r="7" fill="currentColor" />
            </svg>
          </div>
          <div className="mc-tailor-ticket">
            <div className="mc-tailor-ticket-top"><Compass size={29} strokeWidth={1.5} /><Plane size={22} /></div>
            <p className="mc-tailor-ticket-title">{labels.ticketTitle}</p>
            <div className="mc-tailor-ticket-route"><MapPin size={19} /><span /><Plane size={20} /><span /><Flag size={19} /></div>
            <p className="mc-tailor-ticket-line">{labels.ticketLine}</p>
            <div className="mc-tailor-ticket-perforation" />
            <div className="mc-tailor-ticket-bottom"><span>{labels.ticketFooter}</span><span className="mc-tailor-barcode" /></div>
          </div>
          <div className="mc-tailor-stamp"><Sparkles size={20} /><span>{labels.stamp}</span></div>
          <Plane className="mc-tailor-plane" size={39} strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}
