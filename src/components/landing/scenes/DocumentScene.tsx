'use client';

import type { CSSProperties } from 'react';
import { Lock } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import type { NdaBlock } from '@/lib/landing/ndaText';
import { FILL_ORDER, SAMPLE_DEAL } from '@/lib/landing/sampleDeal';
import { notoSerif } from './fonts';
import { DocRun, NDA_BLOCKS, NDA_COUNTS, SceneFrame, T_COLOR, clamp, sectionBlocks, useAutoplayStep } from './_shared';

const FILL_TOTAL = FILL_ORDER.length;
const VERSION_LABEL = `${SAMPLE_DEAL.templateName} v${SAMPLE_DEAL.templateVersion}`;
const fmt = (n: number) => n.toLocaleString('en-US');

/* ─── Excerpt: first page, readable ─────────────────────────────────────── */

type ExcerptPart = { kind: 'blocks'; blocks: NdaBlock[] } | { kind: 'skip'; label: string };

/** Title + opening paragraph, then the sections that hold the deal variables, in order. */
const EXCERPT: ExcerptPart[] = [
  { kind: 'blocks', blocks: NDA_BLOCKS.slice(0, 2) },
  { kind: 'skip', label: 'Sections 1 to 2' },
  { kind: 'blocks', blocks: sectionBlocks(3, 1) },
  { kind: 'skip', label: 'Sections 4 to 6' },
  { kind: 'blocks', blocks: sectionBlocks(7, 1) },
  { kind: 'skip', label: 'Sections 8 to 13' },
  { kind: 'blocks', blocks: sectionBlocks(14, 1) },
];

/** The readable document body, shared with FillScene's mini preview. */
export function DocumentExcerptBody({ filled, compact = false }: { filled: number; compact?: boolean }) {
  return (
    <div
      className={`${notoSerif.className} relative overflow-hidden text-ink ${
        compact ? 'max-h-[22rem] px-4 pt-4 text-xs leading-[1.6]' : 'max-h-[30rem] px-5 pt-5 text-[14.5px] leading-[1.62] sm:px-9'
      }`}
    >
      {EXCERPT.map((part, i) =>
        part.kind === 'skip' ? (
          <p key={i} className="my-3 flex items-center gap-2 font-doc-mono text-xs text-muted-ink">
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            {part.label}, fixed text
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </p>
        ) : (
          part.blocks.map((block, j) =>
            block.kind === 'title' ? (
              <h3 key={`${i}-${j}`} className={`${compact ? 'text-sm' : 'text-base'} font-bold`}>
                <DocRun block={block} filled={filled} />
              </h3>
            ) : block.kind === 'heading' ? (
              <h4 key={`${i}-${j}`} className={`${compact ? 'mt-2 text-xs' : 'mt-3 text-sm'} font-bold`}>
                <DocRun block={block} filled={filled} />
              </h4>
            ) : (
              <p key={`${i}-${j}`} className="mt-1.5">
                <DocRun block={block} filled={filled} />
              </p>
            ),
          )
        ),
      )}
      <div className="h-16" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-white/0 to-white" aria-hidden="true" />
    </div>
  );
}

/* ─── Wall: the whole agreement, small and dense ────────────────────────── */

function WallBody({ dim, fontSize }: { dim: number; fontSize: number }) {
  // Legal text fades toward a texture; the variable values stay lit.
  const style = {
    '--legal-o': String(1 - 0.8 * clamp(dim, 0, 1)),
    fontSize: `${fontSize}px`,
  } as CSSProperties;
  return (
    <div
      className={`${notoSerif.className} columns-1 gap-6 px-5 py-5 leading-[1.5] text-ink sm:columns-2 sm:px-7 lg:columns-3`}
      style={style}
    >
      {NDA_BLOCKS.map((block, i) => {
        const Tag = block.kind === 'text' ? 'p' : 'h4';
        return (
          <Tag
            key={i}
            className={`${block.kind === 'title' ? 'mb-2 text-[1.25em] font-bold' : block.kind === 'heading' ? 'mt-2 font-bold' : 'mt-1'} break-inside-avoid-column`}
          >
            {block.segments.map((seg, j) =>
              seg.isVariable ? (
                <span key={j} className="rounded-[2px] bg-tint px-px font-bold text-teal-800">
                  {seg.text}
                </span>
              ) : (
                <span
                  key={j}
                  className="opacity-[var(--legal-o)] transition-opacity duration-300 ease-out motion-reduce:transition-none"
                >
                  {seg.text}
                </span>
              ),
            )}
          </Tag>
        );
      })}
    </div>
  );
}

/* ─── Scene ─────────────────────────────────────────────────────────────── */

interface BaseProps {
  className?: string;
  /** Accessible description of the illustration; a sensible default is provided. */
  label?: string;
}

export interface DocumentExcerptProps extends BaseProps {
  variant?: 'excerpt';
  /** 0..6 deal fields filled, in FILL_ORDER (Party A, Party B, Purpose, Effective date, Term, Governing law). Default 6. */
  filled?: number;
  /** Plays `filled` 0..6 once on a timer (off under reduced motion). */
  autoplay?: boolean;
}

export interface DocumentWallProps extends BaseProps {
  variant: 'wall';
  /** 0..1: how far the fixed legal text recedes (opacity 1 to 0.2). Default 1. Variables never dim. */
  dim?: number;
  /** Wall type size in px. Default 9 (decorative; the figure carries an aria-label). */
  fontSize?: number;
  /** Show the mono meta line with the real counts. Default true. */
  showMeta?: boolean;
}

export type DocumentSceneProps = DocumentExcerptProps | DocumentWallProps;

/** The standard NDA as a paper sheet: a readable first page, or the whole agreement as a wall. */
export function DocumentScene(props: DocumentSceneProps) {
  if (props.variant === 'wall') return <DocumentWall {...props} />;
  return <DocumentExcerpt {...props} />;
}

function DocumentExcerpt({ filled = FILL_TOTAL, autoplay = false, className = '', label }: DocumentExcerptProps) {
  const current = clamp(Math.floor(useAutoplayStep(filled, FILL_TOTAL, autoplay, 220, { startDelayMs: 450 })), 0, FILL_TOTAL);
  return (
    <SceneFrame
      className={className}
      label={label ?? 'The standard mutual NDA with party names, purpose and dates filling in while the legal text stays locked.'}
    >
      <Sheet
        className="overflow-hidden"
        meta={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {VERSION_LABEL}
            </span>
            <span>
              Variables <b className={`font-medium text-ink ${T_COLOR}`}>{current}</b>/{FILL_TOTAL} · legal text unchanged
            </span>
          </div>
        }
      >
        <DocumentExcerptBody filled={current} />
      </Sheet>
    </SceneFrame>
  );
}

function DocumentWall({ dim = 1, fontSize = 9, showMeta = true, className = '', label }: DocumentWallProps) {
  return (
    <SceneFrame
      className={className}
      label={
        label ??
        `The whole standard NDA: ${fmt(NDA_COUNTS.legalWords)} words of fixed legal text, with the ${NDA_COUNTS.variableFields} fields you fill highlighted.`
      }
    >
      <Sheet
        className="overflow-hidden"
        meta={
          showMeta ? (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                {VERSION_LABEL}
              </span>
              <span>
                {fmt(NDA_COUNTS.legalWords)} words fixed · {NDA_COUNTS.variableFields} fields yours
              </span>
            </div>
          ) : undefined
        }
      >
        <WallBody dim={dim} fontSize={fontSize} />
      </Sheet>
    </SceneFrame>
  );
}
