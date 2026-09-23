'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RubricMark } from '@/components/shapes'

interface Idea {
  id: string
  title: string
  artist: string
  by: string
  votes: number
  songKey: string
}

interface SetRow {
  id: string
  kind: 'song' | 'spoken'
  title: string
  detail: string
  songKey?: string
  fresh?: boolean
}

const INITIAL_SET: SetRow[] = [
  {
    id: 's1',
    kind: 'song',
    title: 'Great Are You Lord',
    detail: 'All Sons & Daughters',
    songKey: 'G',
  },
  { id: 's2', kind: 'spoken', title: 'Call to worship', detail: 'Psalm 95:1–3' },
  { id: 's3', kind: 'song', title: 'Goodness of God', detail: 'Bethel Music', songKey: 'A' },
  { id: 's4', kind: 'song', title: 'King of Kings', detail: 'Hillsong Worship', songKey: 'D' },
]

const INITIAL_IDEAS: Idea[] = [
  { id: 'i1', title: 'Way Maker', artist: 'Sinach', by: 'Ren', votes: 4, songKey: 'E' },
  { id: 'i2', title: 'Gratitude', artist: 'Brandon Lake', by: 'Mia', votes: 3, songKey: 'C' },
  { id: 'i3', title: 'Build My Life', artist: 'Pat Barrett', by: 'Dev', votes: 2, songKey: 'D' },
]

export function Composition() {
  const [set, setSet] = useState<SetRow[]>(INITIAL_SET)
  const [ideas, setIdeas] = useState<Idea[]>(INITIAL_IDEAS)
  const [dragId, setDragId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const [armed, setArmed] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLParagraphElement>(null)

  const promote = useCallback(
    (id: string) => {
      const idea = ideas.find((i) => i.id === id)
      if (!idea) return
      setIdeas((prev) => prev.filter((i) => i.id !== id))
      setSet((prev) => [
        ...prev,
        {
          id: idea.id,
          kind: 'song',
          title: idea.title,
          detail: idea.artist,
          songKey: idea.songKey,
          fresh: true,
        },
      ])
      if (liveRef.current) {
        liveRef.current.textContent = `${idea.title} moved into the set at position ${set.filter((r) => r.kind === 'song').length + 1}.`
      }
    },
    [ideas, set],
  )

  const reset = useCallback(() => {
    setSet(INITIAL_SET)
    setIdeas(INITIAL_IDEAS)
  }, [])

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    setDragId(id)
    setArmed(false)
    setGhost({ x: e.clientX, y: e.clientY })
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  useEffect(() => {
    if (!dragId) return

    const move = (e: PointerEvent) => {
      setGhost({ x: e.clientX, y: e.clientY })
      const box = dropRef.current?.getBoundingClientRect()
      setArmed(
        !!box &&
          e.clientX >= box.left &&
          e.clientX <= box.right &&
          e.clientY >= box.top &&
          e.clientY <= box.bottom,
      )
    }
    const up = (e: PointerEvent) => {
      const box = dropRef.current?.getBoundingClientRect()
      const inside =
        !!box &&
        e.clientX >= box.left &&
        e.clientX <= box.right &&
        e.clientY >= box.top &&
        e.clientY <= box.bottom
      if (inside) promote(dragId)
      setDragId(null)
      setGhost(null)
      setArmed(false)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [dragId, promote])

  const songNo = (() => {
    let n = 0
    return set.map((r) => (r.kind === 'song' ? ++n : 0))
  })()

  const draggedIdea = ideas.find((i) => i.id === dragId)

  return (
    <div className="sheet select-none overflow-hidden shadow-lift-raised">
      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3">
        <p className="label">Sunday · 9.30 rehearsal — demo</p>
        <button
          type="button"
          onClick={reset}
          className="label cursor-pointer underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
        >
          Reset
        </button>
      </div>

      <div
        ref={dropRef}
        className={`transition-colors duration-200 ${armed ? 'bg-rubric-wash' : ''}`}
      >
        <div className="flex items-baseline gap-3 px-5 pb-2 pt-5">
          <h3 className="font-display text-base font-semibold">The set</h3>
          <span className="num text-[0.6875rem] text-muted-foreground">
            {set.filter((r) => r.kind === 'song').length} songs
          </span>
        </div>

        <ul className="px-5 pb-5">
          {set.map((row, i) => (
            <li
              key={row.id}
              className={`flex items-center gap-3 border-t border-rule py-2.5 ${
                row.fresh ? 'animate-settle' : ''
              }`}
            >
              <span className="num w-5 shrink-0 text-[0.6875rem] text-muted-foreground">
                {row.kind === 'song' ? String(songNo[i]).padStart(2, '0') : ''}
              </span>
              {row.kind === 'song' ? (
                <span
                  className={`block size-2 shrink-0 rounded-full bg-rubric ${
                    row.fresh ? 'animate-promote' : ''
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <RubricMark size={14} />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={`font-display block truncate text-sm leading-tight ${
                    row.kind === 'spoken' ? 'italic text-rubric' : 'font-medium'
                  }`}
                >
                  {row.title}
                </span>
                <span className="block truncate text-xs leading-tight text-muted-foreground">
                  {row.detail}
                </span>
              </span>
              {row.songKey && (
                <span className="num rounded-[2px] border border-rule px-1.5 py-0.5 text-[0.6875rem]">
                  {row.songKey}
                </span>
              )}
            </li>
          ))}
          {armed && (
            <li className="border-t border-dashed border-rubric py-2.5 text-xs italic text-rubric">
              Release to add to the set
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-rule bg-sunk">
        <div className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-5">
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-base font-semibold">Ideas</h3>
            <span className="num text-[0.6875rem] text-muted-foreground">from 3 people</span>
          </div>
          <p className="hidden items-center gap-1.5 text-[0.6875rem] text-muted-foreground sm:flex">
            Drag one up
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M12 20V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
        </div>

        <ul className="px-5 pb-5">
          {ideas.map((idea) => (
            <li
              key={idea.id}
              className={`flex items-center gap-3 border-t border-rule py-2.5 ${
                dragId === idea.id ? 'opacity-35' : ''
              }`}
            >
              <span
                onPointerDown={(e) => onPointerDown(e, idea.id)}
                className="block size-3 shrink-0 cursor-grab touch-none rounded-full border-[1.5px] border-ballpoint active:cursor-grabbing"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-sm font-medium leading-tight">
                  {idea.title}
                </span>
                <span className="block truncate text-xs leading-tight text-muted-foreground">
                  {idea.artist} · {idea.by}
                </span>
              </span>
              <span className="flex items-center gap-2" title={`${idea.votes} upvotes`}>
                <span className="flex items-end gap-[3px]" aria-hidden="true">
                  {Array.from({ length: idea.votes }).map((_, i) => (
                    <span key={i} className="block h-3 w-[2px] rounded-full bg-ballpoint" />
                  ))}
                </span>
                <span className="num text-[0.6875rem] text-muted-foreground">{idea.votes}</span>
              </span>
              <button
                type="button"
                onClick={() => promote(idea.id)}
                className="flex size-8 items-center justify-center rounded-[3px] border border-rule-strong text-ink transition-colors hover:border-rubric hover:bg-rubric hover:text-on-rubric"
                aria-label={`Move ${idea.title} into the set`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path d="M12 20V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
          {ideas.length === 0 && (
            <li className="border-t border-rule py-6 text-center text-xs italic text-muted-foreground">
              Every idea made the set. That never happens.
            </li>
          )}
        </ul>
      </div>

      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />

      {ghost && draggedIdea && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-[3px] border border-rule-strong bg-sheet px-3 py-1.5 shadow-lift-raised"
          style={{ left: ghost.x + 12, top: ghost.y - 16 }}
        >
          <span className="block size-2.5 rounded-full border-[1.5px] border-ballpoint" />
          <span className="font-display text-xs font-medium">{draggedIdea.title}</span>
        </div>
      )}
    </div>
  )
}
