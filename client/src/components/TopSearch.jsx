import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import "./extras.css";

export default function TopSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const text = q.trim();
    navigate(text ? `/tasks?search=${encodeURIComponent(text)}` : "/tasks");
  }

  return (
    <form className="top-search" onSubmit={submit}>
      <Search size={16} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tasks..."
        aria-label="Search tasks"
      />
    </form>
  );
}