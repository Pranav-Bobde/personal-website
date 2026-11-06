import { createFileRoute } from "@tanstack/react-router";

import { WorkCaseStudy } from "@/components/work-case-study";
import { workStudyPageSeo } from "@/lib/seo";
import { realEstateStudy } from "@/lib/work-studies";

export const Route = createFileRoute("/work/real-estate-whatsapp")({
  head: () => workStudyPageSeo(realEstateStudy),
  component: CaseStudyPage,
});

function CaseStudyPage() {
  return (
    <WorkCaseStudy title={realEstateStudy.title}>
      <p>
        {
          "Real-estate businesses wanted a WhatsApp agent that could answer property questions from their own documents, capture what buyers are looking for and book site visits, without custom code for each business. So a business adds its company information and documents, sets up its properties, connects a WhatsApp number and turns on an agent."
        }
      </p>
      <p>
        {
          "The MVP deadline got cut from three months to one, and I built the whole backend myself, along with the deployments and some of the frontend."
        }
      </p>
      <p>
        {
          "For booking, I didn't want the model deciding more than it needed to. It handles the conversation, and when someone wants a visit it opens a WhatsApp form. Backend code then checks the submission, saves the booking and sends the confirmation, so the model never writes the booking record."
        }
      </p>
      <p>
        {
          "As we kept adding features, I could see the gaps at scale, so I got PgBouncer and Hatchet into our sprints next to the feature work."
        }
      </p>
      <p>
        {
          "Hatchet's first job was the form reminder. When the form goes out, it schedules a nudge for 5, 15 or 30 minutes later, depending on the agent. When it wakes up, it checks the database and skips the message if the person already submitted."
        }
      </p>
      <p>
        {
          "After we moved from MinIO to S3, WhatsApp images silently stopped working in production. I fixed it by detecting the real file type from the bytes and setting the right Content-Type, which also repaired the existing images without a DB migration."
        }
      </p>
      <p>
        {
          "The backend runs on TypeScript, Bun and Hono, with Postgres, Qdrant, LlamaParse and S3."
        }
      </p>
    </WorkCaseStudy>
  );
}
