import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { FOOTER_CONTENT } from "@/content/footer";

/**
 * Defines module-level values for brand and contact and links and schedule and legal links and notice and legal.
 */
const { brand, contact, links, schedule, legalLinks, notice, legal } = FOOTER_CONTENT;

const CONTACT_ICONS: Record<(typeof contact.items)[number]["icon"], LucideIcon> = {
  location: MapPin,
  email: Mail,
  phone: Phone,
};

const COLUMN_TITLE =
  "mb-3 font-display text-sm font-extrabold uppercase tracking-[0.06em] text-navy";

// Soft break before the @ so the whole "@domain" wraps instead of splitting a word.
function EmailText({ email }: Readonly<{ email: string }>) {
  const [user, domain] = email.split("@");
  if (!domain) return email;

  return (
    <>
      {user}
      <wbr />@{domain}
    </>
  );
}

/**
 * Renders the public footer component.
 * @returns Rendered component.
 */
export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-6xl justify-items-center gap-10 px-6 py-14 text-center sm:grid-cols-2 lg:grid-cols-[1.3fr_1.6fr_1fr_1fr] lg:justify-items-stretch lg:text-left">
        <div className="flex flex-col items-center sm:col-span-2 lg:col-span-1 lg:items-start">
          <div className="flex flex-col items-center gap-3 lg:flex-row">
            <Image
              src={brand.logo.src}
              alt={brand.logo.alt}
              width={44}
              height={44}
              className="h-14 w-14 object-contain"
            />
            <span className="font-display font-bold leading-tight text-primary-dark">
              {brand.name}
            </span>
          </div>

          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-text-muted">
            {brand.description}
          </p>
        </div>

        <div>
          <h3 className={COLUMN_TITLE}>{contact.title}</h3>
          <ul className="flex flex-col items-center text-sm text-text-muted lg:items-start lg:gap-2.5">
            {contact.items.map((item) => {
              const Icon = CONTACT_ICONS[item.icon];

              return (
                <li key={item.icon} className="flex min-h-11 items-center justify-center gap-2.5 lg:min-h-0 lg:justify-start">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-surface text-primary-dark">
                    <Icon size={16} aria-hidden />
                  </span>
                  {"href" in item ? (
                    <a
                      href={item.href}
                      className={`inline-flex min-h-11 items-center hover:text-primary lg:min-h-0 ${
                        item.icon === "phone" ? "whitespace-nowrap" : ""
                      }`}
                    >
                      <span>
                        {item.icon === "email" ? <EmailText email={item.label} /> : item.label}
                      </span>
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className={COLUMN_TITLE}>{links.title}</h3>
          <ul className="flex flex-col items-center text-sm text-text-muted lg:items-start lg:gap-2.5">
            {[...links.items, ...legalLinks].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center hover:text-primary lg:min-h-0">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className={COLUMN_TITLE}>{schedule.title}</h3>
          <p className="max-w-[34ch] text-sm leading-relaxed text-text-muted">
            {schedule.description}
          </p>
        </div>
      </div>

      <div className="border-t border-border px-6 py-6">
        <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-text-muted">
          {notice.beforeEmail}{" "}
          <a href={`mailto:${notice.email}`} className="font-semibold text-primary-dark hover:underline">
            <EmailText email={notice.email} />
          </a>
          {notice.afterEmail}{" "}
          <Link
            href={notice.policyLink.href}
            className="font-semibold text-primary-dark hover:underline"
          >
            {notice.policyLink.label}
          </Link>
          .
        </p>
      </div>

      <div className="border-t border-border px-6 py-5 text-center text-xs text-text-subtle">
        © {year} {brand.name} · {legal}
      </div>
    </footer>
  );
}
