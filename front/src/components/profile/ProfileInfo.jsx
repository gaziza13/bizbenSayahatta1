import { Link } from "react-router-dom";
import cupIcon from "../../assets/cup.svg";

export default function ProfileInfo({
  email, username, travelStyle, user,
  advisorStatus, advisorSuccess, latestApplication,
  onOpenAdvisorModal, onLogout,
}) {
  return (
    <div className="info">
      <div className="style"><span>Email:</span> <span className="email">{email}</span></div>
      <div className="style"><span>Username:</span> <span className="username">{username}</span></div>
      <div className="style"><span>Travel style:</span><strong>{travelStyle}</strong></div>
      <div className="style"><span>Role:</span>
      
      <strong>{user?.role || "USER"}</strong>
        <strong className={`advisor-status status-${advisorStatus.code.toLowerCase()}`}>
          {advisorStatus.label}
        </strong>
      </div>

      {advisorSuccess && <p className="advisor-success">{advisorSuccess}</p>}
      {latestApplication?.review_reason && (
        <p className="advisor-note">Manager note: {latestApplication.review_reason}</p>
      )}

      {user?.role !== "TRIPADVISOR" ? (
        <button
          className="advisor-cta"
          disabled={advisorStatus.code === "PENDING"}
          onClick={onOpenAdvisorModal}
        >
          {advisorStatus.code === "PENDING" ? "Application pending" : "Become TripAdvisor"}
        </button>
      ) : (
        <div className="advisor-panel">
          <strong>TripAdvisor tools are active</strong>
          <div className="level">
            <span>Check Trip status</span>
            <Link to="/tripstatus"><button>check status</button></Link>
          </div>
        </div>
      )}

      {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
        <Link className="plan-link" to="/manager/advisors">Open manager approvals</Link>
      )}

      <div className="advisor-panel">
        <div className="level">
          <span>Traveler Badge:</span>
          <Link to="/map">
            <button>upgrade level <img src={cupIcon} alt="Cup" width="15" height="15" /></button>
          </Link>
        </div>
      </div>

      <button className="logout" onClick={onLogout}>Logout</button>
    </div>
  );
}
