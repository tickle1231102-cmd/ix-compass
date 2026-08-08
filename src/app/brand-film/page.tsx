import { redirect } from "next/navigation";

/** Brand film is an intro overlay after login — not a standalone page. */
export default function BrandFilmPage() {
  redirect("/");
}
