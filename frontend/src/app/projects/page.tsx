import LibraryIndex from "@/components/library/LibraryIndex";

export default function ProjectsPage() {
  return (
    <LibraryIndex
      section="projects"
      heading="Projects"
      intro={[
        "A strong project on your CV gives an interviewer something concrete to dig into, and gives you a conversation you are prepared for. Generic projects, like a moving-average backtest or a neural net that predicts prices, rarely stand out, and they often contain mistakes an experienced interviewer will spot in minutes.",
        "Each project is a brief in the style of a real research assignment: a clear question, the data to use, and what a finished answer looks like. You write your own code, reach your own conclusion and present it as a short research note. The result is work you can show, explain and defend under questioning.",
        "Start with Project 1. More projects are on the way.",
      ]}
    />
  );
}
