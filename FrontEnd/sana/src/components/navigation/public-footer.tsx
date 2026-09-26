import Image from "next/image";
import Link from "next/link";
import { FOOTER_CONTENT } from "@/content/footer";

const { brand, contact, links, schedule, legal } = FOOTER_CONTENT;

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
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

          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            {brand.description}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-text">{contact.title}</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {contact.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-text">{links.title}</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {links.items.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-text">{schedule.title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            {schedule.description}
          </p>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5 text-center text-xs text-text-subtle">
        © {year} {brand.name} · {legal}
      </div>
    </footer>
  );
}