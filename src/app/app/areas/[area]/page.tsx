import { AreaView } from "@/components/area-view";
import { FinanceView } from "@/components/finance-view";

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (area === "financas") return <FinanceView />;
  return <AreaView area={area} />;
}
