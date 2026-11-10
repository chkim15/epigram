import LibraryIndex from "@/components/library/LibraryIndex";

export default function NotebooksPage() {
  return (
    <LibraryIndex
      section="notebooks"
      heading="Notebooks"
      intro={[
        "Quant interviews no longer stop at brainteasers. Researcher and trader interviews often ask you to walk through a study you have done: where the data came from, how you avoided look-ahead bias, what the result really shows, and what would prove it wrong. Most candidates have never run one from start to finish.",
        "Each notebook is a complete research study on US equities and ETFs, built on public data. It takes you through the whole workflow: the hypothesis, the data cleaning, the backtest, the robustness checks and an honest verdict. Several end in a negative result, because telling a real edge from a statistical accident is exactly what firms test.",
        "Read them to learn the methods interviewers expect you to know, such as event studies, factor models, cointegration and transaction costs, and borrow the structure when you write up your own work.",
      ]}
    />
  );
}
