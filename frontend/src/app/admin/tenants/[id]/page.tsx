"use client";

import { useParams } from "next/navigation";
import { TenantDetailPage } from "@/features/platform-admin/tenant-detail-page";

export default function AdminTenantDetailRoutePage() {
  const { id } = useParams<{ id: string }>();
  return <TenantDetailPage tenantId={id} />;
}
