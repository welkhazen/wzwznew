import { ReactNode } from "react";
import { BrandName } from "@/components/ui/brand-name";
import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from "lucide-react";

interface MinimalFooterProps {
  topContent?: ReactNode;
  maxWidthClassName?: string;
  resourceLinks?: Array<{ title: string; href: string }>;
  leftLinks?: Array<{ title: string; href: string }>;
  edgeToScreen?: boolean;
}

export function MinimalFooter({
  topContent,
  maxWidthClassName = "max-w-7xl",
  resourceLinks = [],
  leftLinks = [],
  edgeToScreen = false,
}: MinimalFooterProps) {
  const year = new Date().getFullYear();

  const company = [
    {
      title: "About Us",
      href: "#",
    },
    {
      title: "Careers",
      href: "#",
    },
    {
      title: "Brand Assets",
      href: "#",
    },
    {
      title: "Privacy Policy",
      href: "#",
    },
    {
      title: "Terms of Service",
      href: "#",
    },
  ];

  const resources = [
    {
      title: "Community",
      href: "#",
    },
    {
      title: "Security",
      href: "/security",
    },
  ];
  const allResources = [...resources, ...resourceLinks];

  const socialLinks = [
    {
      icon: <FacebookIcon className="size-4" />,
      link: "#",
      label: "Facebook",
    },
    {
      icon: <GithubIcon className="size-4" />,
      link: "#",
      label: "GitHub",
    },
    {
      icon: <InstagramIcon className="size-4" />,
      link: "#",
      label: "Instagram",
    },
    {
      icon: <LinkedinIcon className="size-4" />,
      link: "#",
      label: "LinkedIn",
    },
    {
      icon: <TwitterIcon className="size-4" />,
      link: "#",
      label: "Twitter",
    },
    {
      icon: <YoutubeIcon className="size-4" />,
      link: "#",
      label: "YouTube",
    },
  ];

  return (
    <footer className={`minimal-footer relative ${edgeToScreen ? "px-0 pb-0" : "px-2 pb-12 sm:px-4 sm:pb-14"}`}>
      <div
        className={`minimal-footer-shell ${edgeToScreen ? "w-full rounded-none border-x-0" : `mx-auto ${maxWidthClassName} rounded-[1.65rem]`} relative overflow-hidden border border-raw-gold/15 bg-[linear-gradient(155deg,rgba(18,18,18,0.96)_0%,rgba(10,10,10,0.98)_52%,rgba(6,6,6,1)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]`}
      >
        <div className="minimal-footer-glow-a pointer-events-none absolute inset-0 bg-[radial-gradient(460px_220px_at_18%_-5%,rgba(241,196,45,0.14),transparent_70%)]" />
        <div className="minimal-footer-glow-b pointer-events-none absolute inset-0 bg-[radial-gradient(520px_220px_at_88%_118%,rgba(241,196,45,0.08),transparent_72%)]" />
        <div className="minimal-footer-grain pointer-events-none absolute inset-0 opacity-[0.2] [background-image:radial-gradient(circle,rgba(241,196,45,0.22)_1px,transparent_1px)] [background-size:10px_10px]" />

        {topContent ? (
          <div className="minimal-footer-top relative border-b border-raw-gold/15 bg-raw-gold/[0.035] px-4 py-6 text-center sm:px-6">
            {topContent}
          </div>
        ) : null}

        <div className="minimal-footer-grid relative grid grid-cols-6 gap-8 p-5 sm:p-7">
          <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
            <a
              href="/"
              className="minimal-footer-brand w-max rounded-xl border border-transparent px-2 py-1 font-display text-2xl tracking-[0.22em] text-raw-text/85 transition-all hover:border-raw-gold/20 hover:bg-raw-gold/[0.06] hover:text-raw-text"
              aria-label="raW home"
            >
              <BrandName />
            </a>

            <p className="minimal-footer-tagline max-w-sm text-sm leading-relaxed text-raw-silver/70">
              A comprehensive financial technology platform.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  className="minimal-footer-social group rounded-lg border border-raw-border/55 bg-raw-black/35 p-1.5 text-raw-silver/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-raw-gold/30 hover:bg-raw-gold/[0.08] hover:text-raw-gold"
                  target="_blank"
                  rel="noreferrer"
                  href={item.link}
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>

            {leftLinks.length > 0 ? (
              <div className="minimal-footer-left-links mt-1 flex flex-col gap-1.5 text-sm text-raw-silver/72">
                {leftLinks.map(({ href, title }) => (
                  <a
                    key={title}
                    className="minimal-footer-link w-max transition-colors hover:text-raw-gold hover:underline"
                    href={href}
                  >
                    {title}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="col-span-3 w-full md:col-span-1">
            <span className="minimal-footer-heading mb-2 block text-[11px] uppercase tracking-[0.18em] text-raw-gold/60">Resources</span>
            <div className="flex flex-col gap-1.5">
              {allResources.map(({ href, title }) => (
                <a key={title} className="minimal-footer-link w-max py-0.5 text-sm text-raw-silver/72 transition-colors hover:text-raw-gold hover:underline" href={href}>
                  {title}
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-3 w-full md:col-span-1">
            <span className="minimal-footer-heading mb-2 block text-[11px] uppercase tracking-[0.18em] text-raw-gold/60">Company</span>
            <div className="flex flex-col gap-1.5">
              {company.map(({ href, title }) => (
                <a key={title} className="minimal-footer-link w-max py-0.5 text-sm text-raw-silver/72 transition-colors hover:text-raw-gold hover:underline" href={href}>
                  {title}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="minimal-footer-bottom relative border-t border-raw-gold/12 bg-raw-black/35 px-4 py-5 sm:px-6">
          <p className="minimal-footer-copy text-center text-sm text-raw-silver/58">
            © <a className="minimal-footer-credit text-raw-gold/85 transition-colors hover:text-raw-gold" href="https://x.com/sshahaider" target="_blank" rel="noreferrer">sshahaider</a>. All rights reserved {year}
          </p>
        </div>
      </div>
    </footer>
  );
}
