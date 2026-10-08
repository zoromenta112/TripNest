import { redirect } from "next/navigation";

const DEMO_READINESS_PATH =
  "/trips/11111111-1111-4111-8111-111111111111/readiness";

export default function HomePage() {
  redirect(DEMO_READINESS_PATH);
}
