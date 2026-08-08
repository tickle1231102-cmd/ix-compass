import { redirect } from "next/navigation";

export default function LegacyRedirect() {
  redirect("/org/community");
}
