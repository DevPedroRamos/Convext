import { FeedbackBoard } from "@/components/dashboard/feedback-board";
import { listClients } from "@/lib/clients";
import { listFeedbacks } from "@/lib/demands";
import { getCurrentUserProfile, isAdmin } from "@/lib/profile";

export default async function FeedbackPage() {
  const [{ profile }, feedbacks, clients] = await Promise.all([
    getCurrentUserProfile(),
    listFeedbacks(),
    listClients(),
  ]);

  return <FeedbackBoard feedbacks={feedbacks} clients={clients} canDelete={isAdmin(profile)} />;
}
