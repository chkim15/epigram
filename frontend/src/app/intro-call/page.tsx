import { redirect } from "next/navigation";

// The free intro call for Premium members was discontinued; old links go to paid tutoring.
export default function IntroCallPage() {
  redirect("/tutoring");
}
