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
          "I owned the backend of a real-estate WhatsApp platform covering property questions, document ingestion and retrieval, structured lead summaries and site-visit booking."
        }
      </p>
      <p>
        {
          "For booking, I kept validation, storage and confirmation in a defined backend workflow. The model handled conversation, recognized booking intent and opened a WhatsApp Flow form to collect the visitor’s name, date and time."
        }
      </p>
      <p>
        {
          "Backend code validated the submission and returned defined feedback for invalid input. Valid submissions became booking records linked to the user’s context, followed by a predefined confirmation message."
        }
      </p>
      <p>
        {
          "I also introduced a delayed form-reminder workflow using Hatchet. A form-start event scheduled the reminder, and a form-submitted event cancelled the pending job. I tested that workflow locally and in the deployed environment."
        }
      </p>
      <p>
        {"The backend used TypeScript, Bun and Hono, with Postgres, Qdrant, LlamaParse and S3."}
      </p>
    </WorkCaseStudy>
  );
}
