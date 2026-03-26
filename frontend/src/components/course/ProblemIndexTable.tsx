import type { ProblemIndexEntry } from "@/types/course";

interface ProblemIndexTableProps {
  problemIndex: ProblemIndexEntry[];
}

export default function ProblemIndexTable({
  problemIndex,
}: ProblemIndexTableProps) {
  return (
    <div className="mt-8 mb-4">
      <h2
        className="text-lg font-semibold mb-3"
        style={{ color: "var(--foreground)" }}
      >
        Problem Index
      </h2>
      <table className="course-table text-sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Problem</th>
          </tr>
        </thead>
        <tbody>
          {problemIndex.map((entry) => (
            <tr key={entry.number}>
              <td style={{ color: "var(--muted-foreground)" }}>
                {entry.number}
              </td>
              <td>{entry.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
