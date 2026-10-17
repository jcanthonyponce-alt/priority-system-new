import { useEffect, useState } from "react";
import { Archive, Bell, CircleCheck, Plus, RotateCcw } from "lucide-react";
import { api } from "../api";
import { timeAgo } from "../utils";
import "./account.css";

function iconFor(message) {
  if (message.includes("restored")) return { Icon: RotateCcw, cls: "restored" };
  if (message.includes("archive")) return { Icon: Archive, cls: "archived" };
  if (message.includes("completed")) return { Icon: CircleCheck, cls: "done" };
  return { Icon: Plus, cls: "added" };
}

export default function Notifications() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/notifications")
      .then((d) => {
        setItems(d.notifications);
        // opening this page marks everything as read
        if (d.unread > 0) api("/notifications/read", { method: "POST" }).catch(() => {});
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!items) return <p className="loading">Loading...</p>;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <h1 className="page-title">Notifications</h1>
      <p className="muted">
        {unread > 0 ? `You have ${unread} new ${unread === 1 ? "notification" : "notifications"}.` : "You are all caught up."}
      </p>

      <div className="notif-panel">
        {items.length === 0 ? (
          <div className="notif-empty">
            <Bell size={40} />
            <p>No notifications yet. They appear when you add, complete or delete tasks.</p>
          </div>
        ) : (
          items.map((n) => {
            const { Icon, cls } = iconFor(n.message);
            return (
              <div key={n.id} className={"notif-row" + (n.read ? "" : " unread")}>
                <span className={"notif-icon " + cls}>
                  <Icon size={18} />
                </span>
                <div className="notif-text">
                  <div>{n.message}</div>
                  <div className="notif-time">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <span className="notif-new">New</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}