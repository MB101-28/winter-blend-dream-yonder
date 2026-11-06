import { createFileRoute } from "@tanstack/react-router";
import { LanternGame } from "@/components/LanternGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <LanternGame />;
}
