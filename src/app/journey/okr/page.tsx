"use client";
import ScheduleWorkspace from "@/components/pages/ScheduleWorkspace";
import OkrDraftWorkspace from "@/components/pages/OkrDraftWorkspace";
import { useStore } from "@/lib/store";

export default function Page() {
  const { session } = useStore();
  return (
    <div className="space-y-3">
      <ScheduleWorkspace panel="okr" />
      {session?.role === "hr" && <OkrDraftWorkspace />}
    </div>
  );
}
