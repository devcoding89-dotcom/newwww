"use client";

import { useParams } from "next/navigation";
import { CampaignForm } from "../../components/campaign-form";

export default function EditCampaignPage() {
  const params = useParams();
  const { id } = params;

  // Handle potential string array from useParams if needed
  const campaignId = Array.isArray(id) ? id[0] : id;

  return <CampaignForm campaignId={campaignId} />;
}
