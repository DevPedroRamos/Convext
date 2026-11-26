"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Piece } from "@/components/saga/piece";

const HeroScene = dynamic(() => import("@/components/saga/hero-scene"), { ssr: false });

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Cena 3D quando há WebGL; caso contrário, o rei em silhueta sobre o brilho laranja. */
export function HeroVisual() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    // Checagem de capacidade só existe no navegador.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(supportsWebGL());
  }, []);

  return (
    <div aria-hidden="true" className="saga-scene absolute inset-0">
      {webgl ? (
        <HeroScene />
      ) : webgl === false ? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_70%_45%,rgba(243,87,3,.28),transparent_45%)]">
          <Piece kind="king" className="h-[60vh] w-auto translate-x-[20%] text-[#141210] drop-shadow-[18px_0_40px_rgba(243,87,3,.35)]" />
        </div>
      ) : null}
    </div>
  );
}
