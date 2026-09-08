"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { ShieldCheck, ShieldAlert, Search, Download, Printer } from "lucide-react";

type VerifyResult = {
  success: boolean;
  valid?: boolean;
  reason?: string;
  error?: string;
  data?: {
    code: string;
    verificationHash?: string | null;
    format?: string | null;
    signedBy?: string | null;
    verifyUrl?: string | null;
    evidenceUrl?: string | null;
    militaryId?: string | null;
    timestamp?: string;
    action?: string;
    expectedHash?: string;
  };
};

function formatThaiDateTime(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [hash, setHash] = useState(searchParams.get("hash") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [evidenceQrDataUrl, setEvidenceQrDataUrl] = useState<string>("");
  const [verifiedAt, setVerifiedAt] = useState<string>("");

  const verify = async (nextCode = code, nextHash = hash) => {
    if (!nextCode.trim()) {
      setResult({ success: false, error: "กรุณาระบุ verification code" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const q = new URLSearchParams({ code: nextCode.trim() });
      if (nextHash.trim()) q.set("hash", nextHash.trim());
      const res = await fetch(`/api/calculator/verify?${q.toString()}`);
      const json = (await res.json()) as VerifyResult;
      setResult(json);
      setVerifiedAt(new Date().toISOString());
    } catch {
      setResult({ success: false, error: "ไม่สามารถตรวจสอบเอกสารได้" });
      setVerifiedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQrPng = () => {
    if (!evidenceQrDataUrl) return;

    const codeText = (result?.data?.code || code || "VERIFY").replace(/[^a-zA-Z0-9-]/g, "_");
    const fileName = `evidence-qr-${codeText}.png`;
    const a = document.createElement("a");
    a.href = evidenceQrDataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const buildTimestampSeal = () => {
    const stampIso = verifiedAt || new Date().toISOString();
    const compact = stampIso.replace(/[^0-9]/g, "").slice(0, 14);
    const codeText = (result?.data?.code || code || "VERIFY").toUpperCase();
    return `TSA-${compact}-${codeText}`;
  };

  useEffect(() => {
    if (searchParams.get("code")) {
      verify(searchParams.get("code") || "", searchParams.get("hash") || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const buildEvidenceQr = async () => {
      const effectiveCode = (result?.data?.code || code).trim();
      const effectiveHash = (result?.data?.verificationHash || hash).trim();
      const evidenceUrl =
        result?.data?.evidenceUrl ||
        (effectiveCode
          ? `${window.location.origin}/api/calculator/verify?code=${encodeURIComponent(effectiveCode)}${effectiveHash ? `&hash=${encodeURIComponent(effectiveHash)}` : ""}`
          : "");

      if (!evidenceUrl) {
        setEvidenceQrDataUrl("");
        return;
      }

      try {
        const qr = await QRCode.toDataURL(evidenceUrl, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        setEvidenceQrDataUrl(qr);
      } catch {
        setEvidenceQrDataUrl("");
      }
    };

    buildEvidenceQr();
  }, [result, code, hash]);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-emerald-600" />
            ตรวจสอบเอกสารประมาณการสิทธิ (Verification Portal)
          </CardTitle>
          <CardDescription className="text-xs">
            ตรวจสอบความถูกต้องของเอกสารจาก Verification Code และ Verification Hash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Verification Code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น EST-12345678" className="text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Verification Hash (ไม่บังคับ)</label>
              <Input value={hash} onChange={(e) => setHash(e.target.value)} placeholder="SHA-256" className="text-xs font-mono" />
            </div>
          </div>

          <Button onClick={() => verify()} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบเอกสาร"}
          </Button>

          {result && (
            <div className={`rounded-lg border p-3 ${result.valid ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              {result.valid ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    เอกสารถูกต้องและผ่านการยืนยัน
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Code:</span> <span className="font-mono">{result.data?.code}</span></div>
                    <div><span className="text-muted-foreground">Format:</span> <Badge variant="outline">{(result.data?.format || "-").toUpperCase()}</Badge></div>
                    <div><span className="text-muted-foreground">ผู้ลงนาม:</span> {result.data?.signedBy || "-"}</div>
                    <div><span className="text-muted-foreground">Military ID:</span> <span className="font-mono">{result.data?.militaryId || "-"}</span></div>
                    <div className="sm:col-span-2"><span className="text-muted-foreground">เวลาออกเอกสาร:</span> {formatThaiDateTime(result.data?.timestamp)}</div>
                    <div className="sm:col-span-2 break-all"><span className="text-muted-foreground">Hash:</span> <span className="font-mono text-[11px]">{result.data?.verificationHash || "-"}</span></div>
                    <div className="sm:col-span-2 break-all">
                      <span className="text-muted-foreground">หลักฐานดิจิทัล:</span>{" "}
                      <a
                        href={result.data?.evidenceUrl || `#`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-emerald-700"
                      >
                        {result.data?.evidenceUrl || "-"}
                      </a>
                    </div>
                    {evidenceQrDataUrl && (
                      <div className="sm:col-span-2 pt-2">
                        <p className="text-[11px] text-muted-foreground mb-2">QR ย้อนกลับหลักฐานดิจิทัล (Machine-readable proof)</p>
                        <img
                          src={evidenceQrDataUrl}
                          alt="Evidence QR"
                          className="h-36 w-36 rounded-md border border-emerald-200 bg-white p-1"
                        />
                        <div className="flex flex-wrap gap-2 mt-2 print:hidden">
                          <Button type="button" variant="outline" className="text-xs h-8" onClick={handleDownloadQrPng}>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            ดาวน์โหลด QR (PNG)
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="sm:col-span-2 pt-3">
                      <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50/70 px-3 py-3 space-y-1.5">
                        <p className="text-xs font-bold text-emerald-800">ตราเวลาลายเซ็นดิจิทัล (Digital Signature Timestamp Seal)</p>
                        <p className="text-[11px]"><span className="text-muted-foreground">เวลาตรวจสอบล่าสุด:</span> {formatThaiDateTime(verifiedAt)}</p>
                        <p className="text-[11px]"><span className="text-muted-foreground">เวลาเอกสารถูกออก:</span> {formatThaiDateTime(result.data?.timestamp)}</p>
                        <p className="text-[11px] break-all"><span className="text-muted-foreground">Timestamp Seal:</span> <span className="font-mono">{buildTimestampSeal()}</span></p>
                        <p className="text-[11px] break-all"><span className="text-muted-foreground">Evidence URL:</span> <span className="font-mono">{result.data?.evidenceUrl || "-"}</span></p>
                        <div className="pt-1 print:hidden">
                          <Button type="button" variant="outline" className="text-xs h-8" onClick={() => window.print()}>
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            พิมพ์หลักฐานการยืนยัน
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-rose-700">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="h-4 w-4" />
                    ไม่ผ่านการยืนยันเอกสาร
                  </div>
                  <p>{result.error || result.reason || "ไม่พบข้อมูลยืนยัน"}</p>
                  {!!result.data?.expectedHash && (
                    <p className="font-mono text-[11px] break-all">Expected Hash: {result.data.expectedHash}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
