import { createFileRoute } from "@tanstack/react-router";

import { WorkCaseStudy } from "@/components/work-case-study";
import { workStudyPageSeo } from "@/lib/seo";
import { gitReportingStudy } from "@/lib/work-studies";

export const Route = createFileRoute("/work/git-reporting")({
  head: () => workStudyPageSeo(gitReportingStudy),
  component: CaseStudyPage,
});

function CaseStudyPage() {
  return (
    <WorkCaseStudy title={gitReportingStudy.title}>
      <p>
        {"I built a tool that turned structured Git commit messages into project activity reports."}
      </p>
      <p>
        {
          "The input format used conventional commit headers followed by detailed task bullets. This gave the tool a consistent structure to parse, including multiple tasks within a single commit."
        }
      </p>
      <p>
        {
          "For a selected repository and reporting period, code extracted commit dates and task descriptions. AI rewrote those descriptions into readable report entries. I supplied the reporting configuration and contributor details, then checked the inputs and reviewed the generated sheet."
        }
      </p>
      <p>
        {
          "The useful separation was between extracting task information and presenting it. Git supplied the recorded work; code handled extraction; AI helped with wording."
        }
      </p>
      <p>
        <em>{"Illustrative input and output:"}</em>
      </p>
      <pre className="border-border bg-card whitespace-pre-wrap break-words border p-4 text-sm">
        <code>
          {
            "chore(runtime): align Docker Bun runtime\n- Set Docker builds to use a default Bun version\n- Add a build argument to override the version when needed\n- Keep app and worker runtime versions in sync"
          }
        </code>
      </pre>
      <table
        className="w-full table-fixed border-collapse text-left text-sm"
        aria-label="Illustrative generated project report"
      >
        <thead>
          <tr>
            <th scope="col" className="border-border bg-card text-foreground border p-3 w-24">
              {"Date"}
            </th>
            <th scope="col" className="border-border bg-card text-foreground border p-3">
              {"Generated report entry"}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-border break-words border p-3 align-top">{"01 Oct"}</td>
            <td className="border-border break-words border p-3 align-top">
              {"Configured a default Bun version for Docker builds."}
            </td>
          </tr>
          <tr>
            <td className="border-border break-words border p-3 align-top">{"01 Oct"}</td>
            <td className="border-border break-words border p-3 align-top">
              {"Added a build argument to override the Bun version when needed."}
            </td>
          </tr>
          <tr>
            <td className="border-border break-words border p-3 align-top">{"01 Oct"}</td>
            <td className="border-border break-words border p-3 align-top">
              {"Aligned the application and worker runtime versions."}
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        {
          "The result was a repeatable way to prepare reports from task details already recorded in Git, with less manual copying and rewriting and a review step before use."
        }
      </p>
    </WorkCaseStudy>
  );
}
