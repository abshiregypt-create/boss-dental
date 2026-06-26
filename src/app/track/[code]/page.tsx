import { Tracker } from "@/components/Tracker";

export const metadata = {
  title: "Track your appointment — BDIC",
};

export default async function TrackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <Tracker code={code} />;
}
