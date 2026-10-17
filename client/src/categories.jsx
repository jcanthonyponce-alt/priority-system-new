import { BookOpen, Briefcase, Heart, Leaf, Tag, User } from "lucide-react";
import "./categories.css";

export const CATEGORIES = [
  { id: "work", label: "Work", color: "#f59e0b", icon: Briefcase },
  { id: "study", label: "Study", color: "#8b5cf6", icon: BookOpen },
  { id: "personal", label: "Personal", color: "#3b82f6", icon: User },
  { id: "health", label: "Health", color: "#f43f5e", icon: Heart },
  { id: "environment", label: "Environment", color: "#22c55e", icon: Leaf },
  { id: "general", label: "General", color: "#94a3b8", icon: Tag },
];

export function categoryOf(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function CategoryTag({ id }) {
  const c = categoryOf(id);
  return (
    <span className="cat-tag" style={{ "--c": c.color }}>
      {c.label}
    </span>
  );
}