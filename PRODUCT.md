# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: **worship leaders and their teams** at churches, planning a Sunday service or worship night. The leader assembles the set; volunteer musicians and vocalists contribute song ideas and opinions. The group is distributed across different music streaming services, so no single platform can be assumed.

The moment of use is split:
- **Planning, days before** — the leader drafts a set, sends a link, collects ideas from the team, and decides the running order.
- **Contributing, asynchronously** — a team member opens a shared link on a phone, adds a song they heard, votes on others' ideas, and leaves.
- **Reference, at rehearsal or service** — the set is read as a running order, on a phone, in low light, alongside non-song items (call to worship, scripture, prayer).

Secondary, unprioritized: gigging bands and any group collaborating on a song list. The product does not exclude them, but worship team workflows lead when the two conflict.

## Product Purpose

Set Check lets a group build a setlist together without anyone creating an account. A leader creates a setlist, shares a link, and the team adds song ideas, votes on them, and links each song to whatever streaming service they personally use. The leader promotes the winners into "The Set" and orders them.

Success is a set that the whole team helped choose, agreed on before the day, and can each open in their own music app.

## Positioning

Collaboration without an identity system, and platform neutrality by default. Contributors need only a link and a first name. Every song carries links to *all* streaming services (via Odesli), so a Spotify user and an Apple Music user contribute to the same list without friction or conversion steps. Setlist tools tied to a single streaming service or requiring team accounts cannot truthfully claim either.

## Operating Context

- **Two-tier list model.** Songs enter as *Ideas* (grouped by the person who added them) and are *promoted* into *The Set*. Promotion is the core act of decision-making. Drag-and-drop moves items between tiers and reorders The Set.
- **Non-song items in the running order.** Section notes — call to worship, scripture reading, prayer, transitions — sit inline in The Set with their own icon and color. A worship set is not only songs.
- **Voting.** Team members upvote/downvote ideas under their name; vote counts inform what the leader promotes.
- **Identity by name prompt.** A first name stored in localStorage attributes songs and votes. The creator of a setlist gets edit rights; `public_edit` optionally opens editing to anyone with the link.
- **Link-first distribution.** Setlists and individual songs are shared as URLs. A shared song URL opens a platform-picker so the recipient opens it in their own app.
- **Import.** A Spotify playlist can be imported to seed a setlist.
- **Mobile-heavy.** Contribution and rehearsal/service reference happen on phones; planning skews desktop.

## Capabilities and Constraints

Confirmed capabilities: create setlist; add song via search (Odesli/Spotify); import Spotify playlist; promote/demote; drag reorder; vote; per-song notes and arbitrary external links; per-song platform links across Spotify, Apple Music, YouTube, YouTube Music, Amazon Music, Tidal, Deezer, SoundCloud, Pandora; section notes with rich text, icon, and color; cover image upload; setlist description as rich text; share dialog; delete setlist (creator); recently-viewed setlists and recently-shared songs from localStorage; public counters for setlists created and songs shared.

Technical: Next.js 16 App Router, React 19, Tailwind v4, Supabase (Postgres) as the only backend, Vercel Blob for cover uploads, `next-themes` with dark as default, dnd-kit for drag-and-drop, TipTap for rich text, shadcn/ui + Radix primitives.

Durable product constraints confirmed by the user:
- **Free forever.** No monetization, no pricing surface, no upgrade prompts, no paid tier to design around.
- **Platform-neutral streaming.** No streaming service is favored. Spotify, Apple Music, YouTube, Tidal and the rest are peers. Spotify import exists as a convenience, not a preference.

Explicitly *not* confirmed as durable (current implementation facts, open to change):
- The account-free model. Today identity is a localStorage name prompt with no sign-in; the user did not make this permanent. Design should not build an identity system, but should not hard-code copy that makes accounts impossible either.
- The Category 5 credit and contact in the footer, and the existing Set Check logo mark. Present today, not pinned as binding.

## Brand Commitments

Name: **Set Check**. Current mark is a purple checkmark-over-staff SVG (`components/logo.tsx`). Attribution to Category 5 (`hello@category5.co`) appears in the footer. Neither the mark nor the attribution was pinned as non-negotiable — treat both as inherited, changeable with the user's approval.

Domain: `setcheck.app`.

## Evidence on Hand

- One real testimonial, attributed to **Josh**, about coordinating a worship team across different music platforms and using voting/promotion to reach clarity. This is the only endorsement that exists.
- Live counters from Supabase: total setlists created and songs shared. Real numbers, magnitude unknown and possibly small — any design must degrade gracefully when they are low or zero.
- Assets: `public/cat5-logo.svg`, app icons (`icon-light-32x32.png`, `icon-dark-32x32.png`, `icon.svg`, `apple-icon.png`), OG image route at `app/opengraph-image.tsx`.
- No case studies, press, customer logos, benchmarks, or usage claims exist. None may be invented.

## Product Principles

1. **A link is the whole onboarding.** Anything that stands between a shared link and a contributed song is a defect.
2. **Everyone's platform is the right platform.** Never make a contributor feel like a second-class user of their streaming service.
3. **Promotion is the product.** The move from scattered ideas to an agreed, ordered set is the moment worth designing for.
4. **A set is a service, not a playlist.** Scripture, prayer, and transitions belong in the running order alongside songs.
5. **Phone-first under pressure.** The set must be readable at a glance, one-handed, in a dim room, by someone who is about to play.

## Accessibility & Inclusion

No formal standard was established by the user. Product-specific needs implied by the operating context: legible at arm's length on a phone in low light; drag-and-drop reordering must have a keyboard and non-drag equivalent, since promotion and ordering are essential functions; color alone must never carry the meaning of section-note types or vote state.
