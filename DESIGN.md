# Design

<!-- impeccable:design-schema 1 -->

## The World

**The order of service.** Set Check is rendered as the printed running order a worship team actually handles every week — a modern one, cleanly typeset, not a reproduction of a 1950s bulletin.

The fit is literal rather than decorative. The artifact this product replaces is a sheet of paper with the Sunday order on it, marked up by whoever got to it first. The product's verb and the paper's verb are the same: *set the order, then let people write on it.*

This replaces the previous world (Bauhaus *Vorkurs*: drawn 32px grid, three saturated primaries, zero radius, lowercase Jost). That look is anti-reference, not a starting point. The purple-on-near-black shadcn default before it is likewise retired.

## Ink Semantics — the core rule

Three inks, three roles, never reassigned. What separates them is what separates inks on a real order of service: who put them there.

| Ink | Value | Means |
|---|---|---|
| ink | `#1a1a19` | Content. Song titles, names, everything the sheet says. |
| rubric | `#c0301f` | The set, every primary action, and spoken moments. What happens, and what to do. |
| ballpoint | `#2b4c8c` | What the team wrote in: ideas, votes, contributors. |

Marks are printer's marks, and each has a distinct silhouette so no state depends on colour perception:

| Mark | Form | Means |
|---|---|---|
| `SetMark` | filled disc, rubric | A song **in the set**. Decided. |
| `IdeaMark` | hollow ring, ballpoint | A song **idea**. Not yet decided. |
| `RubricMark` | short rule, rubric | A **spoken moment** — scripture, prayer, call to worship. |

Promotion is a hollow ring becoming a filled disc, and the row taking a printed number. Never a colour swap alone.

Spoken moments carry a third signal beyond mark and colour: they are set in **italic**, and never numbered. A reader scanning the order in a dim room can tell a song from a spoken moment by shape alone.

The running-order row renders no other mark. Section notes still carry a stored `icon`, chosen in the edit panel and used there, but it is deliberately absent from the row: a spoken moment that already reads as rule + vermilion + italic does not need a fourth signal, and the devotional glyph set is the period pastiche this world refuses.

## Color

Strategy: **restrained, three named inks on paper.** Colour is rationed by role and never decorative. A rubric that means nothing is a bug.

```
stock       #f5f4f1   the page — uncoated printing stock
sheet       #fdfcfa   a raised sheet: lists, dialogs, inputs
ink         #1a1a19   all content text
rubric      #c0301f   the set, primary action, spoken moments
ballpoint   #2b4c8c   ideas, votes, team annotation
```

Ground is stock; sheets sit **above** it, lighter and lifted on a soft shadow. That difference is how regions are separated — never a drawn texture, and never a hard offset shadow.

Support values are ink at fixed alphas, never a grey ramp:
`--rule` ink @ 11% · `--rule-strong` ink @ 22% · `--muted` ink @ 62% (4.7:1 on stock) · `--sunk` ink @ 4%.
`--rubric-wash` and `--ballpoint-wash` are the two role tints, used only as a field behind a whole row or region.

**Light is the default.** The use scene decides it: a leader planning at a kitchen table on a Thursday evening, and a volunteer adding a song on a phone in daylight. Paper is a daylight material.

**Dark is the same sheet at night, not an inversion.** Ground `#1a1917`, sheets `#232220`, ink `#edebe6`. Rubric lifts to `#e8614b` (5.2:1) and ballpoint to `#8fb0ee` (8.0:1). Dark exists for a real scene: reading the set on a phone at the piano in a dim sanctuary on Sunday morning. It must be as finished as light.

Never introduce a fourth ink. Never gradient one. Destructive is `rubric` plus an explicit word.

## Type

- **Literata** sets display, headings, song titles, and prose. A screen-first reading face: low contrast, sturdy, and modern — it carries the paper without costuming as a historical revival. Its italic is the rubric voice and the display accent.
- **Archivo** sets furniture: UI chrome, buttons, labels, metadata, and all numerals via `.num` (tabular figures). There is no monospace in this system; measurement is Archivo's tabular set, not a technical costume.
- **Labels** (`.label`) are Archivo 0.6875rem, `letter-spacing: 0.1em`, uppercase, ink @ 62%. Structural furniture only — a sheet's header, a column's role. **Never an eyebrow above a heading.**
- Headings are **sentence case**. The previous world's all-lowercase rule is retired.

Scale (rem): 0.6875 / 0.75 / 0.8125 / 0.9375 / 1.125 / 1.5 / 2.625 / 4.25. Display caps at 4.25rem. Body measure 60–70ch; a large hero lede may run shorter.

## Composition

- **No drawn background textures.** No grid, no paper grain, no noise. Ground is flat; structure comes from sheets, rules, and space.
- **Sheets, not cards.** `.sheet` is the one container: `--sheet` fill, 1px `--rule`, 3px radius, and `--lift` — a soft shadow with real offset and blur. Nested sheets are wrong.
- **Hairlines.** 1px `--rule` divides rows; `--rule-strong` divides regions. The one heavier rule in the system is the 2px rubric underline beneath **The set**, which marks the region that matters.
- **Radius is 3px**, uniformly — paper is cut, not moulded. The only circles are the marks themselves.
- **Dotted leaders** (`.rule-leader`) join a label to its value across a gap, as a printed index does.
- **Row annotations stay hairline.** Keys, votes and contributor names are the team's writing on the sheet, so they sit in `--rule` hairlines or plain marks — never in filled slabs that compete with a primary action.
- Spacing is multiples of 4, favouring 8. More space above a heading than below it.

## Motion

Motion is the weight of paper, not animation for its own sake. One authored moment, orchestrated.

**The promotion.** When an idea enters the set, the row settles into place — a short downward translate resolving with an exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`, 420ms), while the mark fills and the number appears. Nothing bounces, arcs, or overshoots. Everything else moves at 150–200ms or not at all.

Respect `prefers-reduced-motion`: the settle becomes a 1-frame state change, and the order still reads.

## Adaptation

Compositions **rebalance rather than shrink.** A two-column arrangement becomes a stacked sequence that keeps the same reading order and the same type sizes where it can.

On a phone the running order keeps its number, mark, title, and key; contributor and timestamp drop before anything structural does.

## Accessibility

- Every drag interaction has a keyboard and button equivalent. Promotion is essential function; drag is an accelerator, never the only path.
- Mark + colour + text (+ italic, for spoken moments) carry every state. Never colour alone.
- Focus is a 2px `rubric` outline at 2px offset, on every interactive element, never removed.
- Body and placeholder text clear 4.5:1 in both themes; `--muted` is fixed at the alpha that holds that floor.
- Minimum 44px touch targets in the workspace.
- Browser surfaces are themed from the palette: selection, caret, scrollbars, focus rings, underline offset.

## Prohibitions

Checked against the world's own materials — a printed order of service uses flat stock, ink, hairlines, and rules, so none of these bans a native device:

- No background textures of any kind. This is the rule the previous world broke.
- No gradients, no glass, no blur-as-decoration. Shadows exist only as `--lift` / `--lift-raised`, always with offset and blur.
- No fourth ink, and no tint of an existing ink promoted to a new role.
- No eyebrow or kicker above a heading.
- No same-size icon-plus-heading-plus-text card triad as page structure. Where the product has something to show, show the running order doing its job.
- No monospace as a technical costume.
- No ordinal numbering of a set whose own copy says the items are equals. Numbers belong to the running order, where sequence is the information.
- No placeholder image tile. A cover renders only when one exists; otherwise the masthead carries the sheet.
- No unicode glyph or emoji standing in for an icon. Icons are drawn SVG at one stroke weight.
- No stock-worship imagery: sunbeams, doves, crosses, stage photography, congregation photos. Pinned by the user.
- No period pastiche: no faux-aged paper, no ornamental rules, no blackletter, no drop caps. The paper is modern.
