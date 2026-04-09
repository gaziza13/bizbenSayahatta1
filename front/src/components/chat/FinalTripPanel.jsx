import { useTranslation } from "react-i18next";

const FALLBACK_DAY_COLORS = ["#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#3182CE", "#805AD5"];

function getDayColor(day, index) {
  return day.color || FALLBACK_DAY_COLORS[index % FALLBACK_DAY_COLORS.length];
}

/** Render the persisted per-chat itinerary grouped by day. */
export default function FinalTripPanel({ trip, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="final-trip-placeholder">
        <p className="right-panel-label">{t("chat.finalTrip")}</p> 
        <div className="trip-loading-card">{t("chat.loadingThisChatSTrip")}</div>
      </div>
    );
  }

  if (!trip?.itinerary?.length) {
    return (
      <div className="final-trip-placeholder">
        <p className="right-panel-label">{t("chat.finalTrip")}</p>
        <div className="trip-empty-card">
          {t("chat.yourTripSummaryWillAppearHereAsWePlanIt")}
        </div>
      </div>
    );
  }

  return (
    <section className="final-trip-section">
      <div className="right-panel-heading">
        <div>
          <p className="right-panel-label">{t("chat.finalTrip")}</p>
          <h3>{trip.city || t("chat.plannedRoute")}</h3>
        </div>
      </div>

      <div className="final-trip-days">
        {trip.itinerary.map((day, index) => (
          <details key={`day-${day.day}`} className="trip-day-card" open={index === 0}>
            <summary className="trip-day-summary">
              <span className="trip-day-label">
                <span
                  className="day-dot"
                  style={{ backgroundColor: getDayColor(day, index) }}
                />
                {t("chat.day")} {day.day}
              </span>
              <span className="trip-day-title">{day.summary || t("chat.planInProgress")}</span>
            </summary>
            <div className="trip-day-stops">
              {(day.stops || []).map((stop, stopIndex) => (
                <div key={`${day.day}-${stopIndex}-${stop.name}`} className="trip-stop-row">
                  <div>
                    <strong>{stop.name}</strong>
                    <p>{stop.address || stop.category || t("chat.detailsComingSoon")}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
