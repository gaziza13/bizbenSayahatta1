import React, { useEffect, useMemo, useState } from "react";
import "../styles/TripStatus.css";
import api from "../api/axios";

export default function TripStatus() {
  const [activeFilter, setActiveFilter] = useState("PENDING");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [tripCategories, setTripCategories] = useState([]);
  const [newTrip, setNewTrip] = useState({
    title: "",
    place: "",
    startDate: "",
    endDate: "",
    budget: "",
    comment: "",
  });

  const filteredTrips = useMemo(
    () => trips.filter((trip) => trip.status === activeFilter),
    [trips, activeFilter]
  );

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("marketplace/advisor/trips/?tab=my");
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setTrips(list);
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.userMessage || "Failed to load trips.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("marketplace/categories/");
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setTripCategories(list);
      } catch {
        setTripCategories([]);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    setNewTrip((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTripFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadPreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setUploadPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const computeDurationDays = (start, end) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 1;
    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitting(false);
    setSubmitError("");
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.title || !newTrip.place) return;

    const firstCategoryId = tripCategories?.[0]?.id;
    if (!firstCategoryId) {
      setSubmitError("No categories available. Please try again later.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    const duration_days = computeDurationDays(newTrip.startDate, newTrip.endDate);
    const media_urls = uploadPreview ? [uploadPreview] : [];
    const available_dates = newTrip.startDate ? [newTrip.startDate] : [];

    try {
      const createPayload = {
        title: newTrip.title.trim(),
        category_id: Number(firstCategoryId),
        destination: newTrip.place.trim(),
        duration_days,
        available_dates,
        price: newTrip.budget === "" ? 0 : Number(newTrip.budget),
        itinerary_json: newTrip.comment ? { notes: newTrip.comment.trim() } : {},
        media_urls,
        visibility: "PUBLIC",
      };

      const createRes = await api.post("marketplace/advisor/trips/", createPayload);
      const createdId = createRes.data?.id;
      if (!createdId) throw new Error("Trip creation failed.");
      await api.post(`marketplace/advisor/trips/${createdId}/submit/`);

      setSubmitSuccess("Trip submitted for review. Status: PENDING.");
      setNewTrip({
        title: "",
        place: "",
        startDate: "",
        endDate: "",
        budget: "",
        comment: "",
      });
      setUploadPreview("");

      // reload list
      const res = await api.get("marketplace/advisor/trips/?tab=my");
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTrips(list);
      setActiveFilter("PENDING");
    } catch (err) {
      const responseData = err?.response?.data;
      const detail = responseData?.detail || err?.userMessage || "Failed to submit trip.";
      setSubmitError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="trip-page">
      <div className="trip-header-row">
        <div>
          <h1 className="trip-title">Trips Status</h1>

          <div className="trip-filters">
            <button
              className={activeFilter === "APPROVED" ? "approved active" : ""}
              onClick={() => setActiveFilter("APPROVED")}
            >
              Approved
            </button>

            <button
              className={activeFilter === "PENDING" ? "in-progress active" : ""}
              onClick={() => setActiveFilter("PENDING")}
            >
              Pending
            </button>

            <button
              className={activeFilter === "REJECTED" ? "rejected active" : ""}
              onClick={() => setActiveFilter("REJECTED")}
            >
              Rejected
            </button>
          </div>
        </div>

        <button className="add-trip-btn" onClick={() => {
          setSubmitError("");
          setSubmitSuccess("");
          setIsModalOpen(true);
        }}>
          + Add New Trip
        </button>
      </div>

      <div className="trip-grid">
        {loading && <div>Loading trips...</div>}
        {!loading && error && <div>{error}</div>}
        {!loading && !error && filteredTrips.length === 0 && (
          <div>No trips in this status yet.</div>
        )}
        {!loading && !error && filteredTrips.map((trip) => (
          <div key={trip.id} className="trip-card">
            <div className="trip-image-container">
              <img
                src={trip.media_urls?.[0] || "https://source.unsplash.com/600x400/?travel"}
                alt={trip.title}
                className="trip-image"
              />
            </div>

            <div className="trip-content">
              <h2 className="trip-name">{trip.title}</h2>
              <p className="trip-location">{trip.destination}</p>
              <p className="trip-date">
                {trip.available_dates?.[0] || "Date not set"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Trip</h2>
              <span className="close-btn" onClick={closeModal}>✕</span>
            </div>

            <form onSubmit={handleAddTrip}>
              <div className="modal-body">
                <input type="file" accept="image/*" onChange={handleTripFileUpload} />

                <input
                  type="text"
                  name="title"
                  placeholder="Trip Name"
                  value={newTrip.title}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="place"
                  placeholder="Place"
                  value={newTrip.place}
                  onChange={handleChange}
                  required
                />

                <div className="date-row">
                  <input
                    type="date"
                    name="startDate"
                    value={newTrip.startDate}
                    onChange={handleChange}
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={newTrip.endDate}
                    onChange={handleChange}
                  />
                </div>

                <input
                  type="number"
                  name="budget"
                  placeholder="Budget"
                  value={newTrip.budget}
                  onChange={handleChange}
                />

                <textarea
                  name="comment"
                  placeholder="Additional information"
                  rows={3}
                  value={newTrip.comment}
                  onChange={handleChange}
                />
              </div>

              {submitError ? <div className="trip-form-error">{submitError}</div> : null}
              {submitSuccess ? <div className="trip-form-success">{submitSuccess}</div> : null}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Add Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
