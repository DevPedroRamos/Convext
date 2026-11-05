import { FeedbackBoard } from "@/components/dashboard/feedback-board";
import { listClients } from "@/lib/clients";
import { listFeedbacks } from "@/lib/demands";
import { listFeedbackTypes } from "@/lib/feedback-types";
import { getCurrentUserProfile, isAdmin, listCreators } from "@/lib/profile";

export default async function FeedbackPage() {
  const [{ profile }, feedbacks, clients, types, creators] = await Promise.all([
    getCurrentUserProfile(),
    listFeedbacks(),
    listClients(),
    listFeedbackTypes(),
    listCreators(),
  ]);

  return (
    <FeedbackBoard
      feedbacks={feedbacks}
      clients={clients}
      types={types}
      creators={creators}
      canDelete={isAdmin(profile)}
    />
  );
}
