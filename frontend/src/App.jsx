import { useState } from "react";

const COLORS = {
  primary: "#1A6BFF",
  primaryDark: "#0F4FCC",
  primaryLight: "#E8F0FF",
  accent: "#FF6B35",
  accentLight: "#FFF0EB",
  success: "#00C48C",
  successLight: "#E6FAF5",
  warning: "#FFB800",
  warningLight: "#FFF8E6",
  danger: "#FF4757",
  dangerLight: "#FFE8EA",
  dark: "#0A0F1E",
  darkMid: "#111827",
  gray900: "#1F2937",
  gray700: "#374151",
  gray500: "#6B7280",
  gray300: "#D1D5DB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  white: "#FFFFFF",
  sidebar: "#0D1B3E",
  sidebarActive: "#1A6BFF",
};

const styles = {
  app: {
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    background: "#F0F4FF",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  // Navigation
  topNav: {
    background: COLORS.dark,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    height: "60px",
    gap: "8px",
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
    flexShrink: 0,
    overflowX: "auto",
    flexWrap: "nowrap",
  },
  navBtn: (active) => ({
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
    background: active ? COLORS.primary : "rgba(255,255,255,0.08)",
    color: active ? COLORS.white : "rgba(255,255,255,0.6)",
  }),
  logo: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: "18px",
    marginRight: "16px",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoIcon: {
    width: "28px",
    height: "28px",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },
  divider: {
    width: "1px",
    height: "24px",
    background: "rgba(255,255,255,0.1)",
    margin: "0 8px",
    flexShrink: 0,
  },
  // Layout
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    height: "calc(100vh - 60px)",
  },
  sidebar: {
    width: "220px",
    background: COLORS.sidebar,
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px",
    gap: "4px",
    flexShrink: 0,
    overflowY: "auto",
  },
  sidebarItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: active ? "600" : "500",
    transition: "all 0.15s",
    background: active ? COLORS.sidebarActive : "transparent",
    color: active ? COLORS.white : "rgba(255,255,255,0.55)",
    border: "none",
    textAlign: "left",
    width: "100%",
  }),
  sidebarSection: {
    fontSize: "10px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    padding: "12px 12px 4px",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  // Cards
  card: {
    background: COLORS.white,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },
  statCard: (color) => ({
    background: COLORS.white,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    borderLeft: `4px solid ${color}`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  }),
  // Typography
  h1: {
    fontSize: "22px",
    fontWeight: "800",
    color: COLORS.gray900,
    margin: 0,
  },
  h2: {
    fontSize: "16px",
    fontWeight: "700",
    color: COLORS.gray900,
    margin: 0,
  },
  h3: {
    fontSize: "14px",
    fontWeight: "600",
    color: COLORS.gray700,
    margin: 0,
  },
  label: {
    fontSize: "11px",
    fontWeight: "600",
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: "28px",
    fontWeight: "800",
    color: COLORS.gray900,
  },
  // Buttons
  btn: (variant = "primary", size = "md") => ({
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "12px 24px" : "8px 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: size === "sm" ? "12px" : "13px",
    fontWeight: "600",
    transition: "all 0.2s",
    background:
      variant === "primary" ? COLORS.primary
      : variant === "accent" ? COLORS.accent
      : variant === "success" ? COLORS.success
      : variant === "danger" ? COLORS.danger
      : variant === "ghost" ? "transparent"
      : variant === "outline" ? COLORS.white
      : COLORS.gray100,
    color:
      variant === "ghost" ? COLORS.primary
      : variant === "outline" ? COLORS.primary
      : variant === "secondary" ? COLORS.gray700
      : COLORS.white,
    border: variant === "outline" ? `1.5px solid ${COLORS.primary}` : "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  }),
  // Badge
  badge: (color = "blue") => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "100px",
    fontSize: "11px",
    fontWeight: "600",
    background:
      color === "blue" ? COLORS.primaryLight
      : color === "green" ? COLORS.successLight
      : color === "orange" ? COLORS.accentLight
      : color === "red" ? COLORS.dangerLight
      : color === "yellow" ? COLORS.warningLight
      : COLORS.gray100,
    color:
      color === "blue" ? COLORS.primary
      : color === "green" ? COLORS.success
      : color === "orange" ? COLORS.accent
      : color === "red" ? COLORS.danger
      : color === "yellow" ? "#B45309"
      : COLORS.gray700,
  }),
  // Table
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: `1px solid ${COLORS.gray100}`,
    background: COLORS.gray50,
  },
  td: {
    padding: "12px 14px",
    fontSize: "13px",
    color: COLORS.gray700,
    borderBottom: `1px solid ${COLORS.gray100}`,
  },
  // Avatar
  avatar: (size = 36, color = COLORS.primary) => ({
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${color}, ${color}99)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: `${size * 0.38}px`,
    fontWeight: "700",
    color: COLORS.white,
    flexShrink: 0,
  }),
  // Input
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: `1.5px solid ${COLORS.gray300}`,
    fontSize: "13px",
    color: COLORS.gray900,
    outline: "none",
    boxSizing: "border-box",
    background: COLORS.white,
    fontFamily: "inherit",
  },
  select: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: `1.5px solid ${COLORS.gray300}`,
    fontSize: "13px",
    color: COLORS.gray700,
    background: COLORS.white,
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  // Grid
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" },
  // Progress bar
  progressBar: (pct, color) => ({
    height: "6px",
    borderRadius: "100px",
    background: COLORS.gray100,
    overflow: "hidden",
    position: "relative",
  }),
  progressFill: (pct, color) => ({
    height: "100%",
    width: `${pct}%`,
    borderRadius: "100px",
    background: color || COLORS.primary,
    transition: "width 0.3s ease",
  }),
};

// ============================================================
// SHARED COMPONENTS
// ============================================================

const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <div>
      <h1 style={styles.h1}>{title}</h1>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: "13px", color: COLORS.gray500 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: "8px" }}>{actions}</div>}
  </div>
);

const StatsRow = ({ stats }) => (
  <div style={styles.grid4}>
    {stats.map((s, i) => (
      <div key={i} style={styles.statCard(s.color)}>
        <span style={styles.label}>{s.label}</span>
        <span style={styles.value}>{s.value}</span>
        {s.sub && <span style={{ fontSize: "12px", color: s.subColor || COLORS.success, fontWeight: "600" }}>{s.sub}</span>}
      </div>
    ))}
  </div>
);

const Avatar = ({ name, size = 36, color = COLORS.primary }) => (
  <div style={styles.avatar(size, color)}>
    {name?.split(" ").map(n => n[0]).slice(0, 2).join("")}
  </div>
);

const Badge = ({ label, color }) => <span style={styles.badge(color)}>{label}</span>;

const SearchBar = ({ placeholder }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔍</span>
    <input style={{ ...styles.input, paddingLeft: "36px" }} placeholder={placeholder || "Search..."} readOnly />
  </div>
);

const CardHeader = ({ title, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
    <h2 style={styles.h2}>{title}</h2>
    {action}
  </div>
);

// ============================================================
// PAGES
// ============================================================

// ---- ADMIN: DASHBOARD ----
const AdminDashboard = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <PageHeader
      title="Admin Dashboard"
      subtitle="École Privée Ibn Khaldoun — 2025/2026"
      actions={
        <>
          <button style={styles.btn("outline", "sm")}>📥 Export</button>
          <button style={styles.btn("primary", "sm")}>+ New Student</button>
        </>
      }
    />
    <StatsRow stats={[
      { label: "Total Students", value: "284", sub: "+12 this month", color: COLORS.primary },
      { label: "Teachers", value: "28", sub: "4 subjects today", color: COLORS.accent },
      { label: "Active Parents", value: "231", sub: "88% engaged", color: COLORS.success },
      { label: "Monthly Revenue", value: "50K", sub: "DZD 50,000", color: COLORS.warning },
    ]} />
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
      {/* Recent Activity */}
      <div style={styles.card}>
        <CardHeader title="Recent Activity" action={<button style={styles.btn("ghost", "sm")}>View All →</button>} />
        {[
          { icon: "📋", msg: "Teacher Meriem submitted grades for 4ème A — Maths", time: "2 min ago", color: COLORS.primaryLight },
          { icon: "✅", msg: "Admin published trimester 1 report cards for 3ème B", time: "15 min ago", color: COLORS.successLight },
          { icon: "📢", msg: "New announcement sent to all parents", time: "1h ago", color: COLORS.accentLight },
          { icon: "👤", msg: "New student Ahmed Benali enrolled in 2ème AS", time: "2h ago", color: COLORS.warningLight },
          { icon: "📁", msg: "Bulk import: 42 students added for Primaire level", time: "Yesterday", color: COLORS.gray100 },
        ].map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${COLORS.gray100}` : "none" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", color: COLORS.gray700 }}>{a.msg}</div>
              <div style={{ fontSize: "11px", color: COLORS.gray500, marginTop: "2px" }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Quick Actions + Alerts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={styles.card}>
          <h2 style={{ ...styles.h2, marginBottom: "14px" }}>Quick Actions</h2>
          {[
            { icon: "📊", label: "Publish Grades", color: COLORS.primary },
            { icon: "👥", label: "Manage Users", color: COLORS.accent },
            { icon: "📢", label: "Send Announcement", color: COLORS.success },
            { icon: "📄", label: "Generate Report Cards", color: COLORS.warning },
          ].map((a, i) => (
            <button key={i} style={{ ...styles.btn("ghost", "sm"), width: "100%", justifyContent: "flex-start", padding: "10px 12px", marginBottom: "6px", background: COLORS.gray50, color: COLORS.gray700, borderRadius: "10px" }}>
              <span style={{ fontSize: "16px" }}>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
        <div style={styles.card}>
          <h2 style={{ ...styles.h2, marginBottom: "12px" }}>⚠️ Alerts</h2>
          <div style={{ padding: "10px 12px", background: COLORS.warningLight, borderRadius: "10px", fontSize: "12px", color: "#92400E", marginBottom: "8px" }}>
            <strong>14 grades pending review</strong> from 3 teachers
          </div>
          <div style={{ padding: "10px 12px", background: COLORS.dangerLight, borderRadius: "10px", fontSize: "12px", color: "#991B1B" }}>
            <strong>8 students</strong> with 3+ absences this week
          </div>
        </div>
      </div>
    </div>
    {/* Class Overview */}
    <div style={styles.card}>
      <CardHeader title="Class Overview" action={<SearchBar placeholder="Search class..." />} />
      <table style={styles.table}>
        <thead>
          <tr>
            {["Class", "Level", "Teacher", "Students", "Avg. Grade", "Attendance", "Status"].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { cls: "1ère AS A", level: "High School", teacher: "M. Hamid", students: 32, avg: "14.2", att: 94, status: "green" },
            { cls: "4ème A", level: "Middle", teacher: "Mme. Meriem", students: 28, avg: "12.8", att: 91, status: "green" },
            { cls: "5ème B", level: "Middle", teacher: "M. Karim", students: 30, avg: "11.5", att: 87, status: "yellow" },
            { cls: "CM2 A", level: "Primary", teacher: "Mme. Fatima", students: 25, avg: "15.1", att: 96, status: "green" },
            { cls: "CE1 B", level: "Primary", teacher: "M. Yacine", students: 22, avg: "13.9", att: 89, status: "yellow" },
          ].map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? COLORS.white : COLORS.gray50 }}>
              <td style={{ ...styles.td, fontWeight: "600", color: COLORS.gray900 }}>{r.cls}</td>
              <td style={styles.td}><Badge label={r.level} color={r.level === "High School" ? "blue" : r.level === "Middle" ? "orange" : "green"} /></td>
              <td style={styles.td}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Avatar name={r.teacher} size={28} />{r.teacher}</div></td>
              <td style={styles.td}>{r.students}</td>
              <td style={{ ...styles.td, fontWeight: "700", color: parseFloat(r.avg) >= 14 ? COLORS.success : parseFloat(r.avg) >= 12 ? COLORS.primary : COLORS.warning }}>{r.avg}/20</td>
              <td style={styles.td}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={styles.progressBar()}><div style={styles.progressFill(r.att, r.att >= 92 ? COLORS.success : COLORS.warning)} /></div>
                  <span style={{ fontSize: "12px", fontWeight: "600" }}>{r.att}%</span>
                </div>
              </td>
              <td style={styles.td}><Badge label={r.status === "green" ? "Good" : "Watch"} color={r.status === "green" ? "green" : "yellow"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ---- ADMIN: STUDENT MANAGEMENT ----
const AdminStudents = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <PageHeader title="Student Management" subtitle="284 students enrolled · 2025/2026"
      actions={
        <>
          <button style={styles.btn("outline", "sm")}>📥 Bulk Import</button>
          <button style={styles.btn("primary", "sm")}>+ Enroll Student</button>
        </>
      }
    />
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <SearchBar placeholder="Search by name, ID..." />
      <select style={styles.select}><option>All Levels</option><option>Primary</option><option>Middle</option><option>High School</option></select>
      <select style={styles.select}><option>All Classes</option><option>1ère AS A</option><option>4ème A</option><option>CM2 A</option></select>
      <select style={styles.select}><option>All Status</option><option>Active</option><option>Inactive</option><option>Suspended</option></select>
    </div>
    <div style={styles.card}>
      <table style={styles.table}>
        <thead>
          <tr>{["Student", "ID", "Class", "Parent", "Phone", "Attendance", "Avg", "Status", "Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {[
            { name: "Ahmed Benali", id: "STD-2024-001", cls: "1ère AS A", parent: "Mme. Benali", phone: "0550 123 456", att: 96, avg: 15.2, status: "active" },
            { name: "Sara Hamid", id: "STD-2024-002", cls: "4ème A", parent: "M. Hamid", phone: "0661 789 012", att: 88, avg: 13.8, status: "active" },
            { name: "Youcef Kaci", id: "STD-2024-003", cls: "5ème B", parent: "Mme. Kaci", phone: "0770 345 678", att: 72, avg: 10.1, status: "watch" },
            { name: "Imane Zerrouk", id: "STD-2024-004", cls: "CM2 A", parent: "M. Zerrouk", phone: "0555 901 234", att: 98, avg: 17.5, status: "active" },
            { name: "Rayan Bouab", id: "STD-2024-005", cls: "CE1 B", parent: "Mme. Bouab", phone: "0699 567 890", att: 91, avg: 14.0, status: "active" },
            { name: "Lina Meziane", id: "STD-2024-006", cls: "1ère AS A", parent: "M. Meziane", phone: "0556 234 567", att: 55, avg: 8.9, status: "suspended" },
          ].map((s, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? COLORS.white : COLORS.gray50 }}>
              <td style={styles.td}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Avatar name={s.name} size={34} color={["#1A6BFF","#FF6B35","#00C48C","#FFB800","#9B59B6","#E74C3C"][i]} /><div><div style={{ fontWeight: "600", fontSize: "13px", color: COLORS.gray900 }}>{s.name}</div></div></div></td>
              <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "12px" }}>{s.id}</td>
              <td style={styles.td}><Badge label={s.cls} color="blue" /></td>
              <td style={{ ...styles.td, fontSize: "12px" }}>{s.parent}</td>
              <td style={{ ...styles.td, fontSize: "12px" }}>{s.phone}</td>
              <td style={styles.td}><span style={{ fontSize: "13px", fontWeight: "600", color: s.att >= 90 ? COLORS.success : s.att >= 75 ? COLORS.warning : COLORS.danger }}>{s.att}%</span></td>
              <td style={{ ...styles.td, fontWeight: "700", color: s.avg >= 14 ? COLORS.success : s.avg >= 10 ? COLORS.primary : COLORS.danger }}>{s.avg}/20</td>
              <td style={styles.td}><Badge label={s.status === "active" ? "Active" : s.status === "watch" ? "Watch" : "Suspended"} color={s.status === "active" ? "green" : s.status === "watch" ? "yellow" : "red"} /></td>
              <td style={styles.td}><div style={{ display: "flex", gap: "6px" }}><button style={styles.btn("outline", "sm")}>View</button><button style={styles.btn("secondary", "sm")}>⋯</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "0 4px" }}>
        <span style={{ fontSize: "12px", color: COLORS.gray500 }}>Showing 6 of 284 students</span>
        <div style={{ display: "flex", gap: "6px" }}>
          {["‹", "1", "2", "3", "...", "48", "›"].map((p, i) => (
            <button key={i} style={{ width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${p === "1" ? COLORS.primary : COLORS.gray300}`, background: p === "1" ? COLORS.primary : COLORS.white, color: p === "1" ? COLORS.white : COLORS.gray700, fontSize: "12px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ---- ADMIN: GRADE MANAGEMENT ----
const AdminGrades = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <PageHeader title="Grade Management" subtitle="Review and publish trimester grades"
      actions={<><button style={styles.btn("accent", "sm")}>📄 Generate Report Cards</button><button style={styles.btn("primary", "sm")}>✅ Publish All</button></>}
    />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
      {[
        { label: "Pending Review", value: "14", color: COLORS.warning, icon: "⏳" },
        { label: "Published", value: "187", color: COLORS.success, icon: "✅" },
        { label: "Report Cards Ready", value: "58", color: COLORS.primary, icon: "📄" },
        { label: "Classes Completed", value: "3/8", color: COLORS.accent, icon: "🏫" },
      ].map((s, i) => (
        <div key={i} style={{ background: COLORS.white, borderRadius: "16px", padding: "18px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
          <div><div style={styles.label}>{s.label}</div><div style={{ fontSize: "24px", fontWeight: "800", color: s.color }}>{s.value}</div></div>
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
      <div style={styles.card}>
        <CardHeader title="Pending Grades — Review Queue" />
        {[
          { teacher: "Mme. Meriem", subject: "Mathematics", class: "4ème A", count: 28, submitted: "Today, 10:42" },
          { teacher: "M. Hamid", subject: "Physics", class: "1ère AS A", count: 32, submitted: "Today, 09:15" },
          { teacher: "Mme. Leila", subject: "French", class: "5ème B", count: 30, submitted: "Yesterday" },
          { teacher: "M. Karim", subject: "Arabic", class: "4ème B", count: 27, submitted: "Yesterday" },
        ].map((g, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${COLORS.gray100}` : "none" }}>
            <Avatar name={g.teacher} size={38} color={["#1A6BFF","#FF6B35","#00C48C","#9B59B6"][i]} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: COLORS.gray900 }}>{g.subject} — {g.class}</div>
              <div style={{ fontSize: "12px", color: COLORS.gray500 }}>{g.teacher} · {g.count} students · {g.submitted}</div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button style={styles.btn("outline", "sm")}>Review</button>
              <button style={styles.btn("success", "sm")}>Publish</button>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.card}>
        <h2 style={{ ...styles.h2, marginBottom: "14px" }}>Class Averages — Trimestre 1</h2>
        {[
          { cls: "CM2 A", avg: 15.1, color: COLORS.success },
          { cls: "1ère AS A", avg: 14.2, color: COLORS.success },
          { cls: "4ème A", avg: 12.8, color: COLORS.primary },
          { cls: "5ème B", avg: 11.5, color: COLORS.warning },
          { cls: "CE1 B", avg: 13.9, color: COLORS.primary },
        ].map((c, i) => (
          <div key={i} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: COLORS.gray700 }}>{c.cls}</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: c.color }}>{c.avg}/20</span>
            </div>
            <div style={styles.progressBar()}><div style={styles.progressFill(c.avg * 5, c.color)} /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---- ADMIN: ATTENDANCE ----
const AdminAttendance = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <PageHeader title="Attendance Management" subtitle="Today: Sunday, February 27, 2026"
      actions={<button style={styles.btn("primary", "sm")}>📤 Export Report</button>}
    />
    <StatsRow stats={[
      { label: "Present Today", value: "261", sub: "92% rate", color: COLORS.success },
      { label: "Absent Today", value: "18", sub: "6.3% rate", color: COLORS.danger },
      { label: "Late Today", value: "5", sub: "1.7% rate", color: COLORS.warning },
      { label: "Unexcused", value: "11", sub: "notified", color: COLORS.accent },
    ]} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      <div style={styles.card}>
        <CardHeader title="Today's Absence List" action={<button style={styles.btn("ghost", "sm")}>Notify All →</button>} />
        {[
          { name: "Ahmed Benali", class: "1ère AS A", status: "Absent", excuse: false },
          { name: "Sara Hamid", class: "4ème A", status: "Late", excuse: true },
          { name: "Youcef Kaci", class: "5ème B", status: "Absent", excuse: false },
          { name: "Imane Zerrouk", class: "CM2 A", status: "Absent", excuse: true },
          { name: "Rayan Bouab", class: "CE1 B", status: "Late", excuse: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${COLORS.gray100}` : "none" }}>
            <Avatar name={s.name} size={32} color={COLORS.gray500} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>{s.name}</div>
              <div style={{ fontSize: "11px", color: COLORS.gray500 }}>{s.class}</div>
            </div>
            <Badge label={s.status} color={s.status === "Late" ? "yellow" : "red"} />
            {s.excuse ? <Badge label="Excused" color="green" /> : <button style={styles.btn("outline", "sm")}>Notify</button>}
          </div>
        ))}
      </div>
      <div style={styles.card}>
        <h2 style={{ ...styles.h2, marginBottom: "14px" }}>Weekly Attendance Rate</h2>
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"].map((day, i) => {
          const pct = [94, 91, 96, 89, 92][i];
          return (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", color: COLORS.gray700 }}>{day}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: pct >= 92 ? COLORS.success : COLORS.warning }}>{pct}%</span>
              </div>
              <div style={styles.progressBar()}><div style={styles.progressFill(pct, pct >= 92 ? COLORS.success : COLORS.warning)} /></div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ---- ADMIN: FINANCIAL ----
const AdminFinancial = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <PageHeader title="Financial Management" subtitle="2025/2026 — Fee Collection Overview"
      actions={<><button style={styles.btn("outline", "sm")}>📊 Reports</button><button style={styles.btn("primary", "sm")}>+ Record Payment</button></>}
    />
    <StatsRow stats={[
      { label: "Total Expected", value: "4.2M", sub: "DZD / year", color: COLORS.primary },
      { label: "Collected", value: "3.1M", sub: "74% collected", color: COLORS.success },
      { label: "Outstanding", value: "1.1M", sub: "26% pending", color: COLORS.danger },
      { label: "This Month", value: "280K", sub: "DZD collected", color: COLORS.warning },
    ]} />
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
      <div style={styles.card}>
        <CardHeader title="Payment Status by Student" action={<button style={styles.btn("outline", "sm")}>Send Reminders</button>} />
        <table style={styles.table}>
          <thead><tr>{["Student", "Class", "Total Fee", "Paid", "Balance", "Status"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              { name: "Ahmed Benali", cls: "1ère AS A", total: "64,000", paid: "64,000", balance: "0", status: "paid" },
              { name: "Sara Hamid", cls: "4ème A", total: "50,000", paid: "35,000", balance: "15,000", status: "partial" },
              { name: "Youcef Kaci", cls: "5ème B", total: "50,000", paid: "0", balance: "50,000", status: "unpaid" },
              { name: "Imane Zerrouk", cls: "CM2 A", total: "50,000", paid: "50,000", balance: "0", status: "paid" },
            ].map((s, i) => (
              <tr key={i}>
                <td style={styles.td}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Avatar name={s.name} size={28} />{s.name}</div></td>
                <td style={styles.td}>{s.cls}</td>
                <td style={{ ...styles.td, fontWeight: "600" }}>{s.total} DZD</td>
                <td style={{ ...styles.td, color: COLORS.success, fontWeight: "600" }}>{s.paid} DZD</td>
                <td style={{ ...styles.td, color: parseInt(s.balance) > 0 ? COLORS.danger : COLORS.gray500, fontWeight: "600" }}>{s.balance} DZD</td>
                <td style={styles.td}><Badge label={s.status === "paid" ? "✓ Paid" : s.status === "partial" ? "Partial" : "Unpaid"} color={s.status === "paid" ? "green" : s.status === "partial" ? "yellow" : "red"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={styles.card}>
          <h2 style={{ ...styles.h2, marginBottom: "14px" }}>Collection Rate by Level</h2>
          {[
            { level: "High School", rate: 81 },
            { level: "Middle School", rate: 74 },
            { level: "Primary", rate: 69 },
          ].map((l, i) => (
            <div key={i} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: COLORS.gray700 }}>{l.level}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: l.rate >= 80 ? COLORS.success : l.rate >= 70 ? COLORS.warning : COLORS.danger }}>{l.rate}%</span>
              </div>
              <div style={styles.progressBar()}><div style={styles.progressFill(l.rate, l.rate >= 80 ? COLORS.success : COLORS.warning)} /></div>
            </div>
          ))}
        </div>
        <div style={{ ...styles.card, background: `linear-gradient(135deg, ${COLORS.primary}, #3B82F6)` }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>NEXT PAYMENT DEADLINE</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: COLORS.white }}>March 10, 2026</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>47 students with outstanding balance</div>
          <button style={{ ...styles.btn("primary"), background: "rgba(255,255,255,0.2)", marginTop: "12px", width: "100%", justifyContent: "center" }}>📧 Send All Reminders</button>
        </div>
      </div>
    </div>
  </div>
);

// ---- TEACHER APP ----
const TeacherApp = () => {
  const [tab, setTab] = useState("home");
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", background: "#F0F4FF", minHeight: "100%", overflow: "auto" }}>
      <div style={{ width: "390px", background: "#fff", borderRadius: "32px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", minHeight: "780px", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Status Bar */}
        <div style={{ background: COLORS.sidebar, padding: "12px 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", fontWeight: "600" }}>9:41</span>
          <div style={{ color: COLORS.white, fontWeight: "800", fontSize: "16px" }}>EduConnect</div>
          <div style={{ display: "flex", gap: "6px", color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>📶 🔋</div>
        </div>
        {/* Header */}
        <div style={{ background: COLORS.sidebar, padding: "12px 24px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Good morning,</div>
              <div style={{ color: COLORS.white, fontSize: "18px", fontWeight: "800" }}>Mme. Meriem 👋</div>
            </div>
            <div style={{ position: "relative" }}>
              <Avatar name="Meriem Hadj" size={42} color={COLORS.primary} />
              <div style={{ position: "absolute", top: "0", right: "0", width: "12px", height: "12px", background: COLORS.success, borderRadius: "50%", border: "2px solid " + COLORS.sidebar }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            {[{ icon: "👥", label: "4 Classes" }, { icon: "📚", label: "3 Subjects" }, { icon: "👤", label: "118 Students" }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: "14px" }}>{s.icon}</div>
                <div style={{ color: COLORS.white, fontSize: "11px", fontWeight: "600", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: COLORS.gray50 }}>
          {/* Today's Schedule */}
          <div style={{ ...styles.card, marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: COLORS.gray900, marginBottom: "12px" }}>📅 Today's Schedule</div>
            {[
              { time: "08:00", subject: "Mathematics", class: "4ème A", room: "B12", color: COLORS.primary },
              { time: "09:30", subject: "Mathematics", class: "5ème B", room: "A08", color: COLORS.primary },
              { time: "11:00", subject: "Sciences", class: "4ème A", room: "Lab 1", color: COLORS.success },
              { time: "14:30", subject: "Mathematics", class: "4ème B", room: "C05", color: COLORS.primary },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < 3 ? "10px" : "0" }}>
                <div style={{ textAlign: "center", width: "48px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: COLORS.gray500 }}>{s.time}</div>
                </div>
                <div style={{ width: "3px", background: s.color, borderRadius: "2px", flexShrink: 0 }} />
                <div style={{ flex: 1, background: s.color + "12", borderRadius: "8px", padding: "8px 10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: s.color }}>{s.subject}</div>
                  <div style={{ fontSize: "11px", color: COLORS.gray500 }}>{s.class} · Room {s.room}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              { icon: "📝", label: "Post Homework", color: COLORS.primary },
              { icon: "📊", label: "Enter Grades", color: COLORS.accent },
              { icon: "📁", label: "Upload Resources", color: COLORS.success },
              { icon: "💬", label: "Messages", color: COLORS.warning, badge: "3" },
            ].map((a, i) => (
              <div key={i} style={{ background: COLORS.white, borderRadius: "14px", padding: "14px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", position: "relative" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: a.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{a.icon}</div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: COLORS.gray700 }}>{a.label}</span>
                {a.badge && <div style={{ position: "absolute", top: "8px", right: "8px", width: "18px", height: "18px", background: COLORS.danger, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: COLORS.white }}>{a.badge}</div>}
              </div>
            ))}
          </div>
          {/* Recent Messages */}
          <div style={styles.card}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: COLORS.gray900, marginBottom: "12px" }}>💬 Recent Messages</div>
            {[
              { parent: "Mme. Benali", child: "Ahmed", msg: "Merci pour votre message concernant...", time: "2h", unread: true },
              { parent: "M. Hamid", child: "Sara", msg: "Quand seront publiés les notes?", time: "4h", unread: true },
              { parent: "Mme. Kaci", child: "Youcef", msg: "D'accord, nous allons surveiller cela", time: "1j", unread: false },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${COLORS.gray100}` : "none", alignItems: "center" }}>
                <Avatar name={m.parent} size={34} color={["#1A6BFF","#FF6B35","#00C48C"][i]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>{m.parent} <span style={{ color: COLORS.gray500, fontWeight: "400" }}>re: {m.child}</span></div>
                  <div style={{ fontSize: "11px", color: COLORS.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.msg}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: COLORS.gray400 }}>{m.time}</span>
                  {m.unread && <div style={{ width: "8px", height: "8px", background: COLORS.primary, borderRadius: "50%" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom Nav */}
        <div style={{ background: COLORS.white, borderTop: `1px solid ${COLORS.gray100}`, padding: "10px 20px 16px", display: "flex", justifyContent: "space-around" }}>
          {[{ icon: "🏠", label: "Home" }, { icon: "📚", label: "Classes" }, { icon: "📊", label: "Grades" }, { icon: "💬", label: "Chat" }, { icon: "👤", label: "Profile" }].map((t, i) => (
            <button key={i} onClick={() => setTab(t.label)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", border: "none", background: "transparent", cursor: "pointer", padding: "4px 8px", borderRadius: "8px" }}>
              <span style={{ fontSize: "20px" }}>{t.icon}</span>
              <span style={{ fontSize: "10px", fontWeight: "600", color: tab === t.label ? COLORS.primary : COLORS.gray500 }}>{t.label}</span>
              {tab === t.label && <div style={{ width: "16px", height: "3px", background: COLORS.primary, borderRadius: "2px" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- PARENT APP ----
const ParentApp = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", background: "#F0F4FF", minHeight: "100%", overflow: "auto" }}>
    <div style={{ width: "390px", background: "#fff", borderRadius: "32px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", minHeight: "780px", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #0D47A1, #1565C0)`, padding: "44px 24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>Parent Dashboard</div>
            <div style={{ color: COLORS.white, fontSize: "18px", fontWeight: "800" }}>Mme. Benali</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🔔</div>
            <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "14px", height: "14px", background: COLORS.danger, borderRadius: "50%", fontSize: "9px", fontWeight: "700", color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center" }}>4</div>
          </div>
        </div>
        {/* Child switcher */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["Ahmed · 1ère AS", "Lina · CM2"].map((c, i) => (
            <div key={i} style={{ padding: "6px 14px", borderRadius: "100px", background: i === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: "600", color: COLORS.white, cursor: "pointer" }}>{c}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: COLORS.gray50 }}>
        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          {[
            { icon: "📊", label: "Average", value: "14.8", color: COLORS.success },
            { icon: "📅", label: "Attendance", value: "96%", color: COLORS.primary },
            { icon: "📋", label: "Homework", value: "3 due", color: COLORS.warning },
          ].map((s, i) => (
            <div key={i} style={{ background: COLORS.white, borderRadius: "14px", padding: "12px 10px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{s.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "10px", color: COLORS.gray500, fontWeight: "600" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Latest Grades */}
        <div style={{ ...styles.card, marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700" }}>📊 Latest Grades — Ahmed</div>
            <span style={{ fontSize: "11px", color: COLORS.primary, fontWeight: "600" }}>Trimestre 1</span>
          </div>
          {[
            { subject: "Mathematics", grade: 16, coef: 5, teacher: "Mme. Meriem" },
            { subject: "Physics", grade: 14.5, coef: 3, teacher: "M. Hamid" },
            { subject: "French", grade: 13, coef: 3, teacher: "Mme. Leila" },
            { subject: "Arabic", grade: 15.5, coef: 3, teacher: "M. Karim" },
            { subject: "Sciences", grade: 14, coef: 2, teacher: "Mme. Fatima" },
          ].map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${COLORS.gray100}` : "none" }}>
              <div style={{ width: "4px", height: "32px", borderRadius: "2px", background: g.grade >= 15 ? COLORS.success : g.grade >= 12 ? COLORS.primary : COLORS.warning }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: COLORS.gray900 }}>{g.subject}</div>
                <div style={{ fontSize: "10px", color: COLORS.gray500 }}>{g.teacher} · Coef. {g.coef}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: g.grade >= 15 ? COLORS.success : g.grade >= 12 ? COLORS.primary : COLORS.warning }}>{g.grade}</div>
                <div style={{ fontSize: "10px", color: COLORS.gray400 }}>/20</div>
              </div>
            </div>
          ))}
          <div style={{ background: `linear-gradient(90deg, ${COLORS.primaryLight}, ${COLORS.successLight})`, borderRadius: "10px", padding: "10px 12px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: COLORS.gray700 }}>Trimester Average</span>
            <span style={{ fontSize: "20px", fontWeight: "900", color: COLORS.primary }}>14.8<span style={{ fontSize: "12px", color: COLORS.gray500 }}>/20</span></span>
          </div>
        </div>
        {/* AI Chatbot */}
        <div style={{ ...styles.card, marginBottom: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px" }}>🤖 Ask EduBot</div>
          <div style={{ background: COLORS.gray50, borderRadius: "12px", padding: "10px 12px", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", color: COLORS.gray500, marginBottom: "4px" }}>You</div>
            <div style={{ fontSize: "12px", color: COLORS.gray700 }}>ما هو معدل أحمد في هذا الفصل؟</div>
          </div>
          <div style={{ background: COLORS.primaryLight, borderRadius: "12px", padding: "10px 12px", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", color: COLORS.primary, marginBottom: "4px" }}>EduBot 🤖</div>
            <div style={{ fontSize: "12px", color: COLORS.gray700 }}>معدل أحمد في الفصل الأول هو <strong>14.8/20</strong>. ترتيبه في القسم هو <strong>3 من 32</strong>. أحسن مادة هي الرياضيات بـ 16/20 🎉</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input style={{ ...styles.input, fontSize: "12px", flex: 1 }} placeholder="Posez une question..." readOnly />
            <button style={{ ...styles.btn("primary"), padding: "10px 14px", borderRadius: "10px" }}>→</button>
          </div>
        </div>
      </div>
      {/* Bottom Nav */}
      <div style={{ background: COLORS.white, borderTop: `1px solid ${COLORS.gray100}`, padding: "10px 10px 16px", display: "flex", justifyContent: "space-around" }}>
        {[{ icon: "🏠", label: "Home" }, { icon: "📊", label: "Grades" }, { icon: "📅", label: "Schedule" }, { icon: "💬", label: "Chat" }, { icon: "🤖", label: "EduBot" }].map((t, i) => (
          <button key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", border: "none", background: "transparent", cursor: "pointer", padding: "4px 8px", borderRadius: "8px" }}>
            <span style={{ fontSize: "20px" }}>{t.icon}</span>
            <span style={{ fontSize: "9px", fontWeight: "600", color: i === 0 ? COLORS.primary : COLORS.gray500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ---- STUDENT APP ----
const StudentApp = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", background: "#F0F4FF", minHeight: "100%", overflow: "auto" }}>
    <div style={{ width: "390px", background: "#fff", borderRadius: "32px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", minHeight: "780px", display: "flex", flexDirection: "column" }}>
      <div style={{ background: `linear-gradient(135deg, #7C3AED, #4F46E5)`, padding: "44px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>1ère AS A · Rank 3rd 🏆</div>
            <div style={{ color: COLORS.white, fontSize: "20px", fontWeight: "800" }}>Ahmed Benali</div>
          </div>
          <Avatar name="Ahmed Benali" size={44} color="rgba(255,255,255,0.2)" />
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          {[{ label: "Average", val: "14.8" }, { label: "Rank", val: "3/32" }, { label: "Attendance", val: "96%" }].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px 10px", textAlign: "center" }}>
              <div style={{ color: COLORS.white, fontSize: "16px", fontWeight: "800" }}>{s.val}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: COLORS.gray50 }}>
        {/* Today's Homework */}
        <div style={{ ...styles.card, marginBottom: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>📝 Homework Due This Week</div>
          {[
            { subject: "Mathematics", task: "Exercices p.127 — Équations", due: "Tomorrow", urgent: true, done: false },
            { subject: "Physics", task: "Lab report — Measurement experiment", due: "Thursday", urgent: false, done: false },
            { subject: "French", task: "Commentaire de texte — Victor Hugo", due: "Friday", urgent: false, done: true },
          ].map((h, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", padding: "10px", background: h.done ? COLORS.gray50 : h.urgent ? COLORS.dangerLight : COLORS.white, borderRadius: "10px", marginBottom: "8px", border: `1px solid ${h.urgent && !h.done ? COLORS.danger + "40" : COLORS.gray100}` }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${h.done ? COLORS.success : COLORS.gray300}`, background: h.done ? COLORS.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", fontSize: "10px", color: COLORS.white }}>{h.done ? "✓" : ""}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: h.urgent ? COLORS.danger : COLORS.primary }}>{h.subject}</div>
                <div style={{ fontSize: "12px", color: h.done ? COLORS.gray500 : COLORS.gray700, textDecoration: h.done ? "line-through" : "none" }}>{h.task}</div>
                <div style={{ fontSize: "10px", color: COLORS.gray500, marginTop: "2px" }}>Due: {h.due}</div>
              </div>
              {h.urgent && !h.done && <div style={{ fontSize: "9px", fontWeight: "700", color: COLORS.danger, background: COLORS.dangerLight, padding: "2px 6px", borderRadius: "6px", height: "fit-content" }}>URGENT</div>}
            </div>
          ))}
        </div>
        {/* Course Resources */}
        <div style={{ ...styles.card, marginBottom: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>📚 Recent Course Resources</div>
          {[
            { icon: "📄", name: "Chapitre 3 — Fonctions.pdf", subject: "Mathematics", size: "2.4 MB" },
            { icon: "🎬", name: "Video: Loi d'Ohm expliquée", subject: "Physics", size: "YouTube" },
            { icon: "📊", name: "Cours complet — Conjugaison.pptx", subject: "French", size: "1.8 MB" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px", background: COLORS.gray50, borderRadius: "10px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", background: COLORS.primaryLight, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: COLORS.gray900 }}>{r.name}</div>
                <div style={{ fontSize: "11px", color: COLORS.gray500 }}>{r.subject} · {r.size}</div>
              </div>
              <button style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${COLORS.gray300}`, background: COLORS.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>⬇</button>
            </div>
          ))}
        </div>
        {/* Announcements */}
        <div style={{ ...styles.card }}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>📢 Announcements</div>
          {[
            { title: "Exam schedule — Trimestre 2", date: "Feb 26", from: "Administration", urgent: true },
            { title: "School trip to Algiers Museum", date: "Feb 24", from: "Administration", urgent: false },
            { title: "Math tutoring every Tuesday 16h", date: "Feb 20", from: "Mme. Meriem", urgent: false },
          ].map((a, i) => (
            <div key={i} style={{ padding: "10px", borderRadius: "10px", background: a.urgent ? COLORS.warningLight : COLORS.gray50, marginBottom: "8px", borderLeft: `3px solid ${a.urgent ? COLORS.warning : COLORS.gray300}` }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: COLORS.gray900 }}>{a.title}</div>
              <div style={{ fontSize: "11px", color: COLORS.gray500, marginTop: "2px" }}>{a.from} · {a.date}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: COLORS.white, borderTop: `1px solid ${COLORS.gray100}`, padding: "10px 10px 16px", display: "flex", justifyContent: "space-around" }}>
        {[{ icon: "🏠", label: "Home" }, { icon: "📝", label: "Homework" }, { icon: "📊", label: "Grades" }, { icon: "📚", label: "Courses" }, { icon: "🤖", label: "EduBot" }].map((t, i) => (
          <button key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", border: "none", background: "transparent", cursor: "pointer" }}>
            <span style={{ fontSize: "20px" }}>{t.icon}</span>
            <span style={{ fontSize: "9px", fontWeight: "600", color: i === 0 ? "#7C3AED" : COLORS.gray500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ---- SUPER ADMIN ----
const SuperAdmin = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <div style={{ background: `linear-gradient(135deg, ${COLORS.dark}, ${COLORS.sidebar})`, borderRadius: "20px", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>Super Admin Panel</div>
        <div style={{ fontSize: "24px", fontWeight: "900", color: COLORS.white, marginTop: "4px" }}>EduConnect SaaS</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Multi-tenant management dashboard</div>
      </div>
      <div style={{ display: "flex", gap: "24px" }}>
        {[{ label: "Active Schools", value: "23" }, { label: "Total Users", value: "4.2K" }, { label: "MRR", value: "$3.8K" }].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "900", color: [COLORS.primary, COLORS.success, COLORS.accent][i] }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
    <StatsRow stats={[
      { label: "Starter Plan", value: "8", sub: "schools", color: COLORS.primary },
      { label: "Pro Plan", value: "12", sub: "schools", color: COLORS.success },
      { label: "Business Plan", value: "3", sub: "schools", color: COLORS.accent },
      { label: "Revenue", value: "$3.8K", sub: "/ month", color: COLORS.warning },
    ]} />
    <div style={styles.card}>
      <CardHeader title="School Tenants" action={<><button style={styles.btn("outline", "sm")}>+ Add School</button></>} />
      <table style={styles.table}>
        <thead>
          <tr>{["School", "Location", "Plan", "Students", "MRR", "Health", "Last Active", "Actions"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {[
            { name: "École Ibn Khaldoun", loc: "Blida", plan: "Pro", students: 284, mrr: "190$", health: 98, active: "2 min ago" },
            { name: "Collège El Feth", loc: "Algiers", plan: "Business", students: 512, mrr: "250$", health: 99, active: "5 min ago" },
            { name: "École Avicenne", loc: "Oran", plan: "Starter", students: 87, mrr: "115$", health: 95, active: "1h ago" },
            { name: "Lycée Emir Abd.", loc: "Constantine", plan: "Pro", students: 245, mrr: "190$", health: 91, active: "3h ago" },
            { name: "École Nour", loc: "Blida", plan: "Starter", students: 63, mrr: "115$", health: 87, active: "Yesterday" },
          ].map((s, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? COLORS.white : COLORS.gray50 }}>
              <td style={styles.td}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><Avatar name={s.name} size={32} color={[COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.danger][i]} /><span style={{ fontWeight: "600", fontSize: "13px" }}>{s.name}</span></div></td>
              <td style={{ ...styles.td, fontSize: "12px", color: COLORS.gray500 }}>📍 {s.loc}</td>
              <td style={styles.td}><Badge label={s.plan} color={s.plan === "Business" ? "blue" : s.plan === "Pro" ? "green" : "orange"} /></td>
              <td style={styles.td}>{s.students}</td>
              <td style={{ ...styles.td, fontWeight: "700", color: COLORS.success }}>{s.mrr}</td>
              <td style={styles.td}><span style={{ fontWeight: "700", fontSize: "13px", color: s.health >= 95 ? COLORS.success : s.health >= 88 ? COLORS.warning : COLORS.danger }}>{s.health}%</span></td>
              <td style={{ ...styles.td, fontSize: "12px", color: COLORS.gray500 }}>{s.active}</td>
              <td style={styles.td}><div style={{ display: "flex", gap: "6px" }}><button style={styles.btn("outline", "sm")}>Manage</button><button style={styles.btn("secondary", "sm")}>⋯</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      <div style={styles.card}>
        <h2 style={{ ...styles.h2, marginBottom: "14px" }}>📊 Revenue Trend (MRR)</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
          {[2100, 2400, 2800, 3100, 3400, 3800].map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "100%", background: i === 5 ? COLORS.primary : COLORS.primaryLight, borderRadius: "6px 6px 0 0", height: `${(v / 4000) * 100}px`, transition: "all 0.3s" }} />
              <span style={{ fontSize: "9px", color: COLORS.gray500 }}>{["Sep","Oct","Nov","Dec","Jan","Feb"][i]}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "10px", fontSize: "12px", color: COLORS.gray500, textAlign: "center" }}>+23% growth over 6 months 📈</div>
      </div>
      <div style={styles.card}>
        <h2 style={{ ...styles.h2, marginBottom: "14px" }}>🔧 System Health</h2>
        {[
          { service: "API Server", status: "Operational", pct: 99.9 },
          { service: "Database", status: "Operational", pct: 99.7 },
          { service: "File Storage (R2)", status: "Operational", pct: 100 },
          { service: "Push Notifications", status: "Operational", pct: 99.5 },
          { service: "AI Chatbot API", status: "Operational", pct: 98.2 },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS.success, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "13px", color: COLORS.gray700 }}>{s.service}</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: COLORS.success }}>{s.pct}%</span>
          </div>
        ))}
        <div style={{ background: COLORS.successLight, borderRadius: "10px", padding: "10px 12px", marginTop: "8px", fontSize: "12px", color: "#065F46", fontWeight: "600", textAlign: "center" }}>
          ✅ All systems operational
        </div>
      </div>
    </div>
  </div>
);

// ---- LOGIN PAGE ----
const LoginPage = ({ role = "admin" }) => {
  const configs = {
    admin: { title: "Admin Portal", subtitle: "School Management", icon: "🏫", gradient: `linear-gradient(135deg, ${COLORS.sidebar}, #1A2F6E)`, color: COLORS.primary },
    teacher: { title: "Teacher Portal", subtitle: "Classroom Management", icon: "👩‍🏫", gradient: `linear-gradient(135deg, #065F46, #047857)`, color: COLORS.success },
    parent: { title: "Parent Portal", subtitle: "Monitor Your Child", icon: "👨‍👩‍👧", gradient: `linear-gradient(135deg, #1E3A8A, #1D4ED8)`, color: "#3B82F6" },
    student: { title: "Student Portal", subtitle: "Your Learning Hub", icon: "🎓", gradient: `linear-gradient(135deg, #4C1D95, #6D28D9)`, color: "#7C3AED" },
    super: { title: "Super Admin", subtitle: "SaaS Management", icon: "⚡", gradient: `linear-gradient(135deg, #1F2937, #111827)`, color: COLORS.accent },
  };
  const c = configs[role];
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100%", padding: "40px 20px", background: "#F0F4FF" }}>
      <div style={{ width: "420px" }}>
        <div style={{ background: c.gradient, borderRadius: "24px 24px 0 0", padding: "40px 32px 32px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", background: "rgba(255,255,255,0.15)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px" }}>{c.icon}</div>
          <div style={{ color: COLORS.white, fontSize: "24px", fontWeight: "900" }}>{c.title}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "4px" }}>{c.subtitle}</div>
        </div>
        <div style={{ background: COLORS.white, borderRadius: "0 0 24px 24px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ ...styles.label, display: "block", marginBottom: "6px" }}>Email Address</label>
            <input style={styles.input} type="email" placeholder="your@school.edu.dz" />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ ...styles.label, display: "block", marginBottom: "6px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input style={styles.input} type="password" placeholder="••••••••" />
              <button style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", fontSize: "16px" }}>👁</button>
            </div>
          </div>
          <button style={{ ...styles.btn("primary"), width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px", fontWeight: "700", background: c.color, borderRadius: "12px" }}>
            Sign In →
          </button>
          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: COLORS.gray500 }}>
            Forgot password? <span style={{ color: c.color, fontWeight: "600", cursor: "pointer" }}>Contact Admin</span>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "16px", display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
          {Object.keys(configs).map(k => (
            <span key={k} style={{ fontSize: "11px", color: COLORS.gray500 }}>{configs[k].icon}</span>
          ))}
          <span style={{ fontSize: "11px", color: COLORS.gray500 }}>EduConnect Algeria © 2026</span>
        </div>
      </div>
    </div>
  );
};

// ---- MESSAGING ----
const MessagingPage = () => (
  <div style={{ display: "flex", height: "100%" }}>
    {/* Conversations list */}
    <div style={{ width: "300px", background: COLORS.white, borderRight: `1px solid ${COLORS.gray100}`, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", borderBottom: `1px solid ${COLORS.gray100}` }}>
        <h2 style={{ ...styles.h2, marginBottom: "12px" }}>Messages</h2>
        <SearchBar placeholder="Search conversation..." />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {[
          { name: "Mme. Benali", role: "Parent of Ahmed", msg: "Merci pour votre retour sur...", time: "2m", unread: 2, online: true },
          { name: "M. Hamid", role: "Parent of Sara", msg: "Quand seront publiés les notes?", time: "15m", unread: 1, online: false },
          { name: "Ahmed Benali", role: "Student · 1ère AS A", msg: "Madame, pouvez-vous expliquer...", time: "1h", unread: 0, online: true },
          { name: "Mme. Kaci", role: "Parent of Youcef", msg: "D'accord, nous discuterons...", time: "3h", unread: 0, online: false },
          { name: "M. Zerrouk", role: "Parent of Imane", msg: "Votre fille a bien progressé!", time: "1d", unread: 0, online: false },
        ].map((c, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", padding: "12px 16px", cursor: "pointer", background: i === 0 ? COLORS.gray50 : COLORS.white, borderBottom: `1px solid ${COLORS.gray50}` }}>
            <div style={{ position: "relative" }}>
              <Avatar name={c.name} size={40} color={["#1A6BFF","#FF6B35","#7C3AED","#00C48C","#FFB800"][i]} />
              {c.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", background: COLORS.success, borderRadius: "50%", border: "2px solid white" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: COLORS.gray900 }}>{c.name}</span>
                <span style={{ fontSize: "10px", color: COLORS.gray400 }}>{c.time}</span>
              </div>
              <div style={{ fontSize: "11px", color: COLORS.gray500 }}>{c.role}</div>
              <div style={{ fontSize: "12px", color: COLORS.gray600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.msg}</div>
            </div>
            {c.unread > 0 && <div style={{ width: "18px", height: "18px", background: COLORS.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: COLORS.white, flexShrink: 0, alignSelf: "center" }}>{c.unread}</div>}
          </div>
        ))}
      </div>
    </div>
    {/* Chat window */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F8F9FF" }}>
      <div style={{ padding: "14px 20px", background: COLORS.white, borderBottom: `1px solid ${COLORS.gray100}`, display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <Avatar name="Mme. Benali" size={40} color={COLORS.primary} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", background: COLORS.success, borderRadius: "50%", border: "2px solid white" }} />
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "700" }}>Mme. Benali</div>
          <div style={{ fontSize: "11px", color: COLORS.gray500 }}>Parent of Ahmed Benali · 1ère AS A · Online</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button style={styles.btn("secondary", "sm")}>📎 Attach</button>
          <button style={styles.btn("outline", "sm")}>📝 Template</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {[
          { from: "parent", msg: "Bonjour Madame Meriem. Je voulais vous contacter au sujet des résultats de mon fils Ahmed en mathématiques.", time: "10:30" },
          { from: "teacher", msg: "Bonjour Madame Benali. Ahmed progresse très bien cette année. Sa dernière note est 16/20, ce qui est excellent!", time: "10:35" },
          { from: "parent", msg: "C'est très encourageant! Avez-vous des recommendations pour qu'il améliore encore davantage?", time: "10:37" },
          { from: "teacher", msg: "Je recommande qu'il fasse les exercices supplémentaires du manuel. Aussi, j'ai posté des ressources importantes dans l'application. 📚", time: "10:42" },
          { from: "parent", msg: "Merci beaucoup pour votre retour sur Ahmed. Nous allons l'encourager!", time: "10:45" },
        ].map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "teacher" ? "flex-end" : "flex-start" }}>
            {m.from === "parent" && <Avatar name="Mme. Benali" size={30} color={COLORS.primary} />}
            <div style={{ maxWidth: "70%", margin: "0 8px" }}>
              <div style={{ background: m.from === "teacher" ? COLORS.primary : COLORS.white, color: m.from === "teacher" ? COLORS.white : COLORS.gray900, padding: "10px 14px", borderRadius: m.from === "teacher" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: "13px", lineHeight: "1.5", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
                {m.msg}
              </div>
              <div style={{ fontSize: "10px", color: COLORS.gray400, marginTop: "3px", textAlign: m.from === "teacher" ? "right" : "left" }}>{m.time}</div>
            </div>
            {m.from === "teacher" && <Avatar name="Meriem Hadj" size={30} color={COLORS.success} />}
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 20px", background: COLORS.white, borderTop: `1px solid ${COLORS.gray100}` }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <textarea style={{ ...styles.input, resize: "none", height: "44px", lineHeight: "1.5" }} placeholder="Type your message..." />
          </div>
          <button style={{ ...styles.btn("secondary", "sm"), padding: "12px", borderRadius: "10px" }}>📎</button>
          <button style={{ ...styles.btn("primary"), padding: "12px 20px", borderRadius: "10px" }}>Send →</button>
        </div>
      </div>
    </div>
  </div>
);

// ---- ANNOUNCEMENTS ----
const AnnouncementsPage = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <PageHeader title="Announcements" subtitle="Communicate with your school community"
      actions={<button style={styles.btn("primary", "sm")}>+ New Announcement</button>}
    />
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {[
          { title: "Trimestre 2 Exam Schedule — Official", date: "Feb 26, 2026", author: "School Director", audience: "All", urgent: true, icon: "📋" },
          { title: "Parent-Teacher Meeting — March 5th at 18h", date: "Feb 24, 2026", author: "Administration", audience: "Parents", urgent: false, icon: "👥" },
          { title: "School Trip to Algiers Museum — March 12th", date: "Feb 22, 2026", author: "M. Yacine", audience: "Students", urgent: false, icon: "🏛️" },
          { title: "New Library Resources Available Online", date: "Feb 20, 2026", author: "Administration", audience: "All", urgent: false, icon: "📚" },
        ].map((a, i) => (
          <div key={i} style={{ ...styles.card, borderLeft: `4px solid ${a.urgent ? COLORS.danger : COLORS.primary}` }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: a.urgent ? COLORS.dangerLight : COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: COLORS.gray900 }}>{a.title}</span>
                  {a.urgent && <Badge label="Urgent" color="red" />}
                </div>
                <div style={{ fontSize: "12px", color: COLORS.gray500 }}>By {a.author} · {a.date}</div>
                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <Badge label={`👁 ${a.audience}`} color="blue" />
                  <button style={styles.btn("ghost", "sm")}>Edit</button>
                  <button style={styles.btn("ghost", "sm")}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* New Announcement Form */}
      <div style={styles.card}>
        <h2 style={{ ...styles.h2, marginBottom: "16px" }}>✏️ Create Announcement</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: "6px" }}>Title</label>
            <input style={styles.input} placeholder="Announcement title..." />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: "6px" }}>Message</label>
            <textarea style={{ ...styles.input, height: "100px", resize: "none" }} placeholder="Write your message..." />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: "6px" }}>Target Audience</label>
            <select style={{ ...styles.select, width: "100%" }}>
              <option>All Users</option>
              <option>Parents Only</option>
              <option>Students Only</option>
              <option>Teachers Only</option>
              <option>Specific Class</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: COLORS.gray700, cursor: "pointer" }}>
              <input type="checkbox" /> Mark as Urgent
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: COLORS.gray700, cursor: "pointer" }}>
              <input type="checkbox" /> Send Push Notification
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px", border: `1.5px dashed ${COLORS.gray300}`, borderRadius: "10px", padding: "16px", justifyContent: "center", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: "20px" }}>📎</span>
            <span style={{ fontSize: "13px", color: COLORS.gray500 }}>Attach files or images</span>
          </div>
          <button style={{ ...styles.btn("primary"), width: "100%", justifyContent: "center", padding: "12px" }}>🚀 Publish Announcement</button>
        </div>
      </div>
    </div>
  </div>
);

// ---- MAIN APP ----
const APPS = [
  { id: "admin", label: "Admin Panel" },
  { id: "teacher", label: "Teacher App" },
  { id: "parent", label: "Parent App" },
  { id: "student", label: "Student App" },
  { id: "superadmin", label: "Super Admin" },
];

const ADMIN_PAGES = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "students", icon: "👥", label: "Students" },
  { id: "teachers", icon: "👩‍🏫", label: "Teachers" },
  { id: "grades", icon: "📋", label: "Grades" },
  { id: "attendance", icon: "✅", label: "Attendance" },
  { id: "financial", icon: "💰", label: "Financial" },
  { id: "messaging", icon: "💬", label: "Messaging" },
  { id: "announcements", icon: "📢", label: "Announcements" },
  { id: "login_admin", icon: "🔐", label: "Login — Admin" },
  { id: "login_teacher", icon: "🔐", label: "Login — Teacher" },
  { id: "login_parent", icon: "🔐", label: "Login — Parent" },
  { id: "login_student", icon: "🔐", label: "Login — Student" },
];

const SUPER_PAGES = [
  { id: "superadmin", icon: "⚡", label: "SaaS Dashboard" },
];

export default function App() {
  const [activeApp, setActiveApp] = useState("admin");
  const [activePage, setActivePage] = useState("dashboard");

  const isMobileApp = activeApp === "teacher" || activeApp === "parent" || activeApp === "student";

  const pages = activeApp === "superadmin" ? SUPER_PAGES : ADMIN_PAGES;

  const renderPage = () => {
    if (isMobileApp) {
      if (activeApp === "teacher") return <TeacherApp />;
      if (activeApp === "parent") return <ParentApp />;
      if (activeApp === "student") return <StudentApp />;
    }
    if (activeApp === "superadmin") return <SuperAdmin />;
    switch (activePage) {
      case "dashboard": return <AdminDashboard />;
      case "students": return <AdminStudents />;
      case "grades": return <AdminGrades />;
      case "attendance": return <AdminAttendance />;
      case "financial": return <AdminFinancial />;
      case "messaging": return <MessagingPage />;
      case "announcements": return <AnnouncementsPage />;
      case "login_admin": return <LoginPage role="admin" />;
      case "login_teacher": return <LoginPage role="teacher" />;
      case "login_parent": return <LoginPage role="parent" />;
      case "login_student": return <LoginPage role="student" />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        button { font-family: 'Plus Jakarta Sans', sans-serif; }
        input, textarea, select { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>
      {/* Top nav */}
      <div style={styles.topNav}>
        <div style={styles.logo}><div style={styles.logoIcon}>🎓</div>EduConnect</div>
        <div style={styles.divider} />
        {APPS.map(a => (
          <button key={a.id} onClick={() => { setActiveApp(a.id); setActivePage("dashboard"); }} style={styles.navBtn(activeApp === a.id)}>{a.label}</button>
        ))}
      </div>
      <div style={styles.content}>
        {/* Sidebar */}
        {!isMobileApp && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarSection}>Navigation</div>
            {pages.map(p => (
              <button key={p.id} onClick={() => setActivePage(p.id)} style={styles.sidebarItem(activePage === p.id)}>
                <span>{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginTop: "8px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Avatar name="Admin User" size={32} color={COLORS.primary} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.9)" }}>École Ibn Khaldoun</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Pro Plan</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Main content */}
        <div style={{ flex: 1, overflowY: isMobileApp ? "hidden" : "auto", padding: isMobileApp ? "0" : "24px", background: isMobileApp ? "#F0F4FF" : "#F0F4FF" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
