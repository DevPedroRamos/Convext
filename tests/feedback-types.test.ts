import { describe, expect, it } from "vitest";
import { filterSearchableOptions } from "@/lib/searchable-select";
import { feedbackTypeSchema } from "@/lib/validations/feedback-type";

describe("catálogo de feedback", () => {
  it("aceita nome e solução vazia", () => {
    expect(feedbackTypeSchema.safeParse({ name: "renda baixa", solution: "" }).success).toBe(true);
  });

  it("rejeita nome curto", () => {
    expect(feedbackTypeSchema.safeParse({ name: "a", solution: "x" }).success).toBe(false);
  });
});

describe("SearchableSelect", () => {
  const options = [
    { value: "1", label: "Ana Costa" },
    { value: "2", label: "Bruno Silva" },
    { value: "3", label: "Carla Mendes" },
  ];

  it("filtra pelo trecho do nome, ignorando maiúsculas", () => {
    expect(filterSearchableOptions(options, "sil").map((option) => option.label)).toEqual(["Bruno Silva"]);
    expect(filterSearchableOptions(options, "  ANA ").map((option) => option.value)).toEqual(["1"]);
  });

  it("devolve a lista inteira sem busca", () => {
    expect(filterSearchableOptions(options, "").length).toBe(3);
  });
});
