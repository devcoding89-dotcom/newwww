
"use client";

import { useParams } from "next/navigation";
import { TemplateForm } from "../components/template-form";

export default function EditTemplatePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return <TemplateForm templateId={id} />;
}
