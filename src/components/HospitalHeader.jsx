import { FiSearch, FiUser } from "react-icons/fi";

function HospitalHeader({ hospitalName = "ESIC User" }) {
  return (
    <header className="hospital-header">
      <div className="hospital-search">
        <FiSearch size={21} />

        <input type="text" placeholder="Search by token, title or status..." />
      </div>

      <div className="hospital-header-right">
        <div className="hospital-user">
          <div className="hospital-user-avatar">
            <FiUser size={20} />
          </div>

          <div className="hospital-user-info">
            <div className="hospital-user-name">{hospitalName}</div>

            <div className="hospital-user-role">Hospital User</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HospitalHeader;
