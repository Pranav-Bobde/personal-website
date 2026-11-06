import { createFileRoute } from "@tanstack/react-router";

import { WorkCaseStudy } from "@/components/work-case-study";
import { workStudyPageSeo } from "@/lib/seo";
import { leaseQaStudy } from "@/lib/work-studies";

export const Route = createFileRoute("/work/lease-qa")({
  head: () => workStudyPageSeo(leaseQaStudy),
  component: CaseStudyPage,
});

function CaseStudyPage() {
  return (
    <WorkCaseStudy title={leaseQaStudy.title}>
      <p>
        {
          "A commercial real-estate client needed answers from leases and their amendments. A question could depend on a newer amendment, a table, or a clause referenced from another page, and the answer had to come from the latest applicable terms."
        }
      </p>
      <p>
        {
          "I took over the project when answer accuracy was stuck at 40-50%. We built an eval set from the client's prioritized questions and scored every change against it. We worked through parsing, chunking, embeddings, hybrid search, query rewriting and metadata filters, and added company, property and document scope selection to narrow retrieval."
        }
      </p>
      <p>
        {
          "The biggest gain came from a hybrid parser: PDF extraction, then a multimodal LLM checking table values against page images, then an LLM pass to reconcile the two."
        }
      </p>
      <p>
        {
          "That took accuracy to 80%+ on the client's own test questions. I also built the web app around it, backend and React frontend."
        }
      </p>
    </WorkCaseStudy>
  );
}
