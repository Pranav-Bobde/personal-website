import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";

import { siteConfig } from "@/lib/config";
import { getNewsletterEmbedScriptUrl } from "@/lib/newsletter-embed";

export function NewsletterCta() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <div className="flex items-start gap-3">
        <Mail size={18} className="text-accent mt-1 shrink-0" />
        <div>
          <h2 className="section-title mb-3">{siteConfig.newsletter.name}</h2>
          <NewsletterDescription />
        </div>
      </div>

      <NewsletterSignupForm />

      <a href="/newsletter" className="text-accent hover:text-foreground mt-5 inline-block text-sm">
        what goes in it →
      </a>
    </section>
  );
}

function NewsletterDescription() {
  return (
    <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
      {siteConfig.newsletter.description}
    </p>
  );
}

interface NewsletterSignupFormProps {
  className?: string;
}

export function NewsletterSignupForm({ className = "mt-6" }: NewsletterSignupFormProps) {
  const formUrl = siteConfig.newsletter.url;
  const scriptUrl = getNewsletterEmbedScriptUrl(formUrl);
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (host.querySelector(".formkit-form")) {
        setStatus("ready");
        observer.disconnect();
      }
    });
    const script = document.createElement("script");

    observer.observe(host, { childList: true, subtree: true });
    script.async = true;
    script.src = scriptUrl;
    script.dataset.uid = new URL(scriptUrl).pathname.split("/").filter(Boolean)[0] ?? "";
    script.addEventListener("error", () => setStatus("error"));
    host.append(script);

    return () => {
      observer.disconnect();
      script.remove();
    };
  }, [formUrl, scriptUrl]);

  return (
    <div className={`newsletter-embed ${className}`} ref={hostRef}>
      {status === "loading" ? (
        <span className="text-muted-foreground text-sm">loading signup…</span>
      ) : null}
      {status === "error" ? (
        <a
          href={formUrl}
          className="text-accent hover:text-foreground text-sm transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          open signup form →
        </a>
      ) : null}
    </div>
  );
}
