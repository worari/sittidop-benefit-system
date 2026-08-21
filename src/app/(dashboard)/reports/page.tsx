import { GetDashboardMetricsUseCase } from "../../../core/use-cases/analytics/GetDashboardMetricsUseCase";
import { ReportGenerator } from "../../../presentation/components/reports/ReportGenerator";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const metricsUseCase = new GetDashboardMetricsUseCase();
  const metrics = await metricsUseCase.execute();

  return (
    <div className="space-y-6">
      <ReportGenerator metrics={metrics} />
    </div>
  );
}
