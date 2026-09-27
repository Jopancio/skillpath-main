import type { Metadata } from "next";
import { NotFound } from "@/components/ui/not-found-2";

export const metadata: Metadata = {
  title: "404 — Halaman tidak ditemukan | SkillPath",
};

export default function NotFoundPage() {
  return <NotFound />;
}
