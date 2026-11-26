"use client";

import { useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Piece } from "@/components/saga/piece";
import { SectionHeading } from "@/components/saga/sections";
import { method, type PieceKind } from "@/lib/saga-content";
import { siteReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

/**
 * O tabuleiro é a explicação do método: cada etapa do texto joga um lance
 * de uma Abertura Italiana. O movimento só acontece quando a etapa chega,
 * e qualquer rolagem no meio do caminho retoma do ponto em que a peça está.
 */

const FILES = "abcdefgh";
type Side = "w" | "b";
type BoardPiece = { id: string; kind: PieceKind; side: Side; square: string };

const backRank: PieceKind[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
const initialPieces: BoardPiece[] = [
  ...backRank.map((kind, i) => ({ id: `w-${kind}-${FILES[i]}`, kind, side: "w" as Side, square: `${FILES[i]}1` })),
  ...[...FILES].map((file) => ({ id: `w-pawn-${file}`, kind: "pawn" as PieceKind, side: "w" as Side, square: `${file}2` })),
  ...backRank.map((kind, i) => ({ id: `b-${kind}-${FILES[i]}`, kind, side: "b" as Side, square: `${FILES[i]}8` })),
  ...[...FILES].map((file) => ({ id: `b-pawn-${file}`, kind: "pawn" as PieceKind, side: "b" as Side, square: `${file}7` })),
];

// Um lance por etapa do método: o das brancas (Saga) e a resposta das pretas.
const moves: { id: string; from: string; to: string }[][] = [
  [{ id: "w-pawn-e", from: "e2", to: "e4" }, { id: "b-pawn-e", from: "e7", to: "e5" }],
  [{ id: "w-knight-g", from: "g1", to: "f3" }, { id: "b-knight-b", from: "b8", to: "c6" }],
  [{ id: "w-bishop-f", from: "f1", to: "c4" }, { id: "b-bishop-f", from: "f8", to: "c5" }],
  [{ id: "w-king-e", from: "e1", to: "g1" }, { id: "w-rook-h", from: "h1", to: "f1" }],
];

function toPercent(square: string) {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  return { xPercent: file * 100, yPercent: (8 - rank) * 100 };
}

export function MethodBoard() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = siteReducedMotion();
    CustomEase.create("saga-move", "0.77,0,0.175,1");

    const pieceEl = (id: string) => root.querySelector<HTMLElement>(`[data-piece="${id}"]`);
    // O SSR já posiciona as peças com translate(%); o GSAP lê isso como px,
    // então zera x/y e passa a controlar só xPercent/yPercent.
    initialPieces.forEach((piece) => gsap.set(pieceEl(piece.id), { x: 0, y: 0, ...toPercent(piece.square) }));

    // Linha do tempo pausada: rótulos s0…s4 marcam a posição depois de cada etapa.
    const timeline = gsap.timeline({ paused: true });
    timeline.addLabel("s0");
    moves.forEach((step, index) => {
      const castle = index === moves.length - 1;
      step.forEach((move, half) => {
        const at = castle ? `s${index}` : `s${index}+=${half * 0.62}`;
        timeline.to(pieceEl(move.id), { ...toPercent(move.to), duration: 0.6, ease: "saga-move" }, at);
      });
      timeline.addLabel(`s${index + 1}`, castle ? "+=0" : "+=0.05");
    });

    const squares = gsap.utils.toArray<HTMLElement>("[data-square]", root);
    const stepEls = gsap.utils.toArray<HTMLElement>("[data-step]", root);
    let current = -1;

    const goTo = (target: number) => {
      if (target === current) return;
      const distance = Math.abs(target - Math.max(current, 0));
      current = target;

      // Casas do último lance e peças que acabaram de jogar ficam marcadas.
      const touched = target > 0 ? moves[target - 1] : [];
      const hot = new Set(touched.flatMap((move) => [move.from, move.to]));
      squares.forEach((square) => square.toggleAttribute("data-hot", hot.has(square.dataset.square!)));
      root.querySelectorAll<HTMLElement>("[data-piece]").forEach((element) => {
        element.toggleAttribute("data-moved", touched.some((move) => move.id === element.dataset.piece));
      });
      stepEls.forEach((element, index) => element.toggleAttribute("data-active", index === target - 1));

      const label = `s${target}`;
      if (reduce) {
        timeline.seek(label);
        return;
      }
      timeline.tweenTo(label, { duration: gsap.utils.clamp(0.5, 1.6, distance * 0.7), ease: "none" });
    };

    const triggers = stepEls.map((element, index) =>
      ScrollTrigger.create({
        trigger: element,
        start: "top 62%",
        end: "bottom 62%",
        onEnter: () => goTo(index + 1),
        onEnterBack: () => goTo(index + 1),
        onLeaveBack: () => index === 0 && goTo(0),
      }),
    );
    goTo(0);

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      timeline.kill();
    };
  }, { scope: rootRef });

  return (
    <section ref={rootRef} id="metodo" className="relative bg-ink py-24 sm:py-32">
      <div className="container-convext">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <SectionHeading index="03" eyebrow={method.eyebrow}>
            {method.title[0]}
            <br />
            <em>{method.accent}</em>
          </SectionHeading>
          <p className="max-w-[46ch] text-base leading-7 text-foreground/55">{method.body}</p>
        </div>

        <div className="mt-16 grid gap-x-16 lg:mt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Tabuleiro: fixo enquanto as etapas passam */}
          <div className="sticky top-0 z-10 -mx-4 bg-ink px-4 pb-6 pt-20 sm:-mx-6 sm:px-6 lg:order-2 lg:top-[calc(50svh-min(30vw,40svh))] lg:mx-0 lg:self-start lg:bg-transparent lg:p-0">
            <Board />
          </div>

          <div className="lg:order-1">
            <div className="py-10 lg:py-0">
              <p className="saga-eyebrow text-foreground/55">{method.subEyebrow}</p>
              <h3 className="saga-title mt-5 text-[clamp(2rem,3.4vw,3.25rem)]">
                {method.subTitle} <em>{method.subAccent}</em>
              </h3>
            </div>
            <ol>
              {method.steps.map((step, index) => (
                <li
                  key={step.title}
                  data-step={index}
                  className="method-step flex min-h-[46svh] flex-col justify-center border-t border-white/10 py-10 lg:min-h-[62svh]"
                >
                  <p className="font-mono text-xs tabular-nums text-foreground/45">
                    {String(index + 1).padStart(2, "0")} <span className="mx-2 text-foreground/25">/</span>
                    <span className="method-notation">{step.notation}</span>
                  </p>
                  <h4 className="mt-4 font-display text-3xl tracking-[-0.045em] sm:text-4xl">{step.title}</h4>
                  <p className="mt-4 max-w-[42ch] text-base leading-7 text-foreground/60">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Board() {
  return (
    <figure
      aria-label="Tabuleiro com uma Abertura Italiana jogada em quatro lances, um por etapa do método."
      className="relative mx-auto w-full max-w-[min(100%,44svh)] lg:max-w-none"
    >
      <div className="relative aspect-square w-full lg:w-[min(100%,60svh)]">
        <div className="grid h-full w-full grid-cols-8 overflow-hidden rounded-[6px] ring-1 ring-white/10">
          {Array.from({ length: 64 }, (_, index) => {
            const file = index % 8;
            const rank = 8 - Math.floor(index / 8);
            const dark = (file + rank) % 2 === 0;
            return (
              <div
                key={index}
                data-square={`${FILES[file]}${rank}`}
                className={cn("board-square relative", dark ? "bg-[#131210]" : "bg-[#1d1a17]")}
              />
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {initialPieces.map((piece) => {
            const { xPercent, yPercent } = toPercent(piece.square);
            return (
              <div
                key={piece.id}
                data-piece={piece.id}
                data-side={piece.side}
                className="board-piece absolute left-0 top-0 grid size-[12.5%] place-items-center"
                style={{ transform: `translate(${xPercent}%, ${yPercent}%)` }}
              >
                <Piece kind={piece.kind} className="h-[86%] w-auto drop-shadow-[0_2px_2px_rgba(0,0,0,.5)]" />
              </div>
            );
          })}
        </div>
        {/* Coordenadas */}
        <div aria-hidden="true" className="absolute -bottom-6 left-0 hidden w-full grid-cols-8 font-mono text-[10px] uppercase text-foreground/30 sm:grid">
          {[...FILES].map((file) => <span key={file} className="text-center">{file}</span>)}
        </div>
        <div aria-hidden="true" className="absolute -left-5 top-0 hidden h-full grid-rows-8 font-mono text-[10px] text-foreground/30 sm:grid">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => <span key={rank} className="grid place-items-center">{rank}</span>)}
        </div>
      </div>
    </figure>
  );
}
