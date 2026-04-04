export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "Dates not set";
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  return startDate || endDate;
}

export function getTripStatus(endDate) {
  if (!endDate) return "active";
  const today = new Date().toISOString().slice(0, 10);
  return endDate >= today ? "active" : "past";
}

export function buildTripCard(thread) {
  const itinerary = thread.plan_json?.itinerary || [];
  const firstStop = itinerary[0]?.stops?.[0];
  const daysGenerated = thread.plan_json?.days_generated || itinerary.length || 0;
  const stopsCount = itinerary.reduce((acc, day) => acc + (day.stops?.length || 0), 0);

  return {
    id: thread.id,
    title: thread.title || (thread.city ? `${thread.city} trip` : "Untitled trip"),
    city: thread.city || thread.plan_json?.city || "Unknown city",
    dateRange: formatDateRange(thread.start_date, thread.end_date),
    daysGenerated,
    stopsCount,
    status: getTripStatus(thread.end_date),
    photoUrl: firstStop?.photo_url || null,
    summary: itinerary[0]?.summary || "Trip plan is ready",
  };
}