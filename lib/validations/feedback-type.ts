import { z } from "zod";

export const feedbackTypeSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do tipo.").max(80),
  solution: z.string().trim().max(4000),
});

export type FeedbackTypeValues = z.infer<typeof feedbackTypeSchema>;
