export default function PublicTripsSection({ styles, loadingTrips, publicTrips }) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <h2>TripAdvisor Trips</h2>
        <span>Verified trips from TripAdvisors</span>
      </div>

      {loadingTrips && <div className={styles.sectionNote}>Loading trips...</div>}
      {!loadingTrips && publicTrips.length === 0 && (
        <div className={styles.sectionNote}>No approved trips yet.</div>
      )}

      {!loadingTrips && publicTrips.length > 0 && (
        <div className={styles.tripGrid}>
          {publicTrips.map((trip) => (
            <div key={trip.id} className={styles.tripCard}>
              {trip.media_urls?.[0] ? (
                <img className={styles.tripPhoto} src={trip.media_urls[0]} alt={trip.title} loading="lazy" />
              ) : (
                <div className={styles.tripPhotoPlaceholder} />
              )}
              <div className={styles.tripMeta}>
                <span className={styles.tripBadge}>TripAdvisor</span>
                <span className={styles.tripCategory}>{trip.category?.name || "Trip"}</span>
              </div>
              <h3 className={styles.tripTitle}>{trip.title}</h3>
              <p className={styles.tripDestination}>{trip.destination}</p>
              <div className={styles.tripFooter}>
                <span>{trip.duration_days} days</span>
                <span>{trip.price ? `$${trip.price}` : "Contact"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
