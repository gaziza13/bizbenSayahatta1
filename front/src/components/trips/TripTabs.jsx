import s from "../../styles/Trips.module.css";

export default function TripTabs({ tab, onTabChange, activeCount, pastCount }) {
  return (
    <div className={s.tabs}>
      <button
        className={`${s.tab} ${tab === "active" ? s.tabActive : ""}`}
        onClick={() => onTabChange("active")}
      >
        Active & Upcoming <span className={s.badge}>{activeCount}</span>
      </button>
      <button
        className={`${s.tab} ${tab === "past" ? s.tabActive : ""}`}
        onClick={() => onTabChange("past")}
      >
        Trip Archive <span className={s.badge}>{pastCount}</span>
      </button>
    </div>
  );
}