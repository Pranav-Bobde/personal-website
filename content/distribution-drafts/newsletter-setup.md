# Newsletter setup checklist

Status: review-only / not published

## Kit account

- Confirm account email.
- Create a landing page or form for `Pranav's Notes`.
- Use this positioning:

```txt
A weekly-ish note for tech launches, important AI/dev news, good reads, and things I'm building or thinking through.
```

- Keep the first form simple:
  - headline: `Pranav's Notes`
  - subtext: same positioning above
  - button: `subscribe`
  - no lead magnet yet

## Website wiring

Kit form created:

- internal name: `Pranav's Notes signup`
- form id: `9713285`
- public subscribe URL: `https://pranav-bobde.kit.com/58ca1bcb46`
- JS embed:

```html
<script async data-uid="58ca1bcb46" src="https://pranav-bobde.kit.com/58ca1bcb46/index.js"></script>
```

The website currently uses the hosted subscribe URL:

```env
VITE_NEWSLETTER_URL=https://pranav-bobde.kit.com/58ca1bcb46
```

Files already prepared to use it:

- `/newsletter`
- homepage newsletter CTA
- top nav `[n] newsletter`
- sitemap entry for `/newsletter`

## Publishing rule

Deep dives stay canonical on `pranavb.xyz`.

Quick takes can start as newsletter issues, then get adapted to DEV/HackerNoon/LinkedIn/X.

Do not make Kit the source of truth for interactive posts. If a post needs animation, embeds, or custom HTML, host that version on `pranavb.xyz` and send the readable summary through Kit.

## Content mix

- interesting tech releases, new launches, and tools worth trying
- important AI/dev news and major events worth knowing
- useful blogs, articles, videos, and posts
- personal posts, blog drafts, projects, experiments, and things currently being worked through
