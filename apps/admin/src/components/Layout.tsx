import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PushNotificationControl } from "./PushNotificationControl";

const groups = [
  { label: "Workspace", items: [{ to: "/data-hub", label: "Data Hub", icon: "◫" }] },
  {
    label: "Studios",
    items: [
      { to: "/email-studio", label: "Email Studio", icon: "✦" },
      { to: "/segments", label: "Segments", icon: "◎" },
      { to: "/automation-studio/automations", label: "Automations", icon: "↯" },
      { to: "/automation-studio/flows", label: "Flows", icon: "⌁" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/entities/villas", label: "Villas", icon: "⌂" },
      { to: "/entities/restaurants", label: "Restaurants", icon: "◈" },
      { to: "/entities/beach-clubs", label: "Beach Clubs", icon: "≈" },
      { to: "/entities/night-clubs", label: "Night Clubs", icon: "✦" },
      { to: "/entities/packs", label: "Packs", icon: "▣" },
      { to: "/entities/activities", label: "Activities", icon: "◇" },
      { to: "/entities/transportation", label: "Transportation", icon: "→" },
    ],
  },
  {
    label: "Website",
    items: [
      { to: "/website/slideshow", label: "Slideshow", icon: "◩" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/entities/chats", label: "Live Chats", icon: "◉" },
      { to: "/entities/contact-requests", label: "Contact Requests", icon: "✉" },
      { to: "/entities/trip-carts", label: "Trip Carts", icon: "▤" },
    ],
  },
  {
    label: "Setup",
    items: [
      { to: "/entities/users", label: "Users", icon: "♙" },
      { to: "/setup/sender-emails", label: "Sender Emails", icon: "@" },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div><b>Moorish</b><span>Administration</span></div>
        </div>
        <nav>
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-account-tools">
          <PushNotificationControl />
        <div className="admin-profile">
          <div className="profile-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div className="profile-copy"><b>{user?.firstName} {user?.lastName}</b><span>{user?.role}</span></div>
          <button onClick={() => void logout()} title="Sign out" aria-label="Sign out">↗</button>
        </div>
        </div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}
