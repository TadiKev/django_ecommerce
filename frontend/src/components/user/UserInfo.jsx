import React from 'react';
import styles from './UserInfo.module.css'; 
import pic from '../../assets/pic.png';

const UserInfo = ({ userInfo, loading }) => {
  if (loading) {
    return <p className="text-center">Loading user information...</p>;
  }

  return (
    <div className="row mb-4">
      <div className={`col-md-3 py-3 card ${styles.textCenter}`}>
        <img
          src={userInfo.profileImage || pic}
          alt="Profile"
          className={`img-fluid rounded-circle mb-3 mx-auto ${styles.profileImage}`}
        />
        <h4>{userInfo.fullName || "N/A"}</h4>
        <p className="text-muted">{userInfo.email || "N/A"}</p>
        <button className="btn mt-2" style={{ backgroundColor: "#6050DC", color: "white" }}>
          Edit Profile
        </button>
      </div>
      <div className="col-md-9">
        <div className="card">
          <div className="card-header" style={{ backgroundColor: "#6050DC", color: "white" }}>
            <h5>Account Overview</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Full Name:</strong> {`${userInfo.fullName || "N/A"} ${userInfo.last_name || "N/A"}`}</p>
                <p><strong>Email:</strong> {`${userInfo.email || "N/A"}`}</p>
                <p><strong>Phone:</strong> {`${userInfo.phone || "N/A"}`}</p>
              </div>
              <div className="col-md-6">
                <p><strong>City:</strong> {`${userInfo.city || "N/A"}`}</p>
                <p><strong>Country:</strong> {`${userInfo.country || "N/A"}`}</p>
                <p><strong>Member Since:</strong> {`${userInfo.memberSince || "N/A"}`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
