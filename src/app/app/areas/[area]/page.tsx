import { AreaView } from "@/components/area-view";

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  return <AreaView area={area} />;
}
