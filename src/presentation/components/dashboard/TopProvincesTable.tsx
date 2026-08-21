"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { formatCurrency, formatNumber } from "../../lib/utils";
import { MapPin } from "lucide-react";

interface TopProvincesTableProps {
  provinces: {
    province: string;
    beneficiaries: number;
    disbursedAmount: number;
  }[];
}

export function TopProvincesTable({ provinces }: TopProvincesTableProps) {
  return (
    <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <div>
            <CardTitle className="text-base font-bold">
              จังหวัดที่มีการประมาณการและเบิกจ่ายสิทธิสูงสุด
            </CardTitle>
            <CardDescription className="text-xs">
              การกระจายตัวของผู้รับสิทธิสวัสดิการตามภูมิภาค
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {provinces.map((prov, index) => {
            const maxBeneficiaries = provinces[0]?.beneficiaries || 1;
            const percentage = (prov.beneficiaries / maxBeneficiaries) * 100;

            return (
              <div key={prov.province} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-400">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {prov.province}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {formatNumber(prov.beneficiaries)} คน
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(prov.disbursedAmount)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
