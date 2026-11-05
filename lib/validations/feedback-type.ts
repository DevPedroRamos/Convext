import { z } from "zod";

export const feedbackTypeSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do tipo."),
  solution: z.string().optional(),
  spawnsCreator: z.boolean().optional(),
});

export type FeedbackTypeValues = z.infer<typeof feedbackTypeSchema>;
