import { siteConfig } from "@/lib/config"
import Link from "next/link"
import { MapPin, Briefcase } from "lucide-react"

export default function Home() {
  return (
    <div className="animate-fade-in">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold animate-slide-up">{siteConfig.name}</h1>

        <div
          className="flex items-center space-x-2 text-sm text-muted-foreground animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <MapPin size={16} />
          <span>{siteConfig.location}</span>
        </div>

        <div
          className="flex items-center space-x-2 text-sm text-muted-foreground animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <Briefcase size={16} />
          <span>{siteConfig.title}</span>
        </div>

        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <p className="text-muted-foreground">
            {siteConfig.bio.main}
          </p>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">{siteConfig.bio.secondaryTitle}</h3>
            <p className="text-muted-foreground">
              {siteConfig.bio.secondary}
            </p>
          </div>
        </div>

        {/* Always show social links section */}
        <div className="pt-8 animate-slide-up" style={{ animationDelay: "400ms" }}>
          <h2 className="section-title">links</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(siteConfig.social).map(([key, url]) => (
              <Link
                key={key}
                href={key === "email" ? `mailto:${url}` : url}
                className="hover:text-accent transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {key}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

