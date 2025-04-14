import React, { useState } from 'react';
import styles from './PaymentSection.module.css';
import api from '../../api';

const PaymentSection = () => {
  const cart_code = localStorage.getItem("cart_code");
  const [loading, setLoading] = useState(false);

  // Payment function for Flutterwave
  function makeFlutterwavePayment() {
    setLoading(true);
    const formData = new FormData();
    formData.append("cart_code", cart_code);

    api.post("initiate_payment/", formData)
      .then(res => {
        console.log("API Response (Flutterwave):", res.data);
        if (res.data && res.data.payment_link) {
          window.location.href = res.data.payment_link;
        } else {
          alert("Payment initiation failed. Please try again.");
        }
      })
      .catch(err => {
        console.error("Error:", err.message);
        alert("An error occurred. Please try again.");
      })
      .finally(() => setLoading(false));
  }

  // Payment function for PayPal
  function makePaypalPayment() {
    setLoading(true);
    const formData = new FormData();
    formData.append("cart_code", cart_code);

    api.post("initiate_paypal_payment/", formData)
      .then(res => {
        console.log("API Response (PayPal):", res.data);
        // Check if the response contains the approval_url
        if (res.data && res.data.approval_url) {
          window.location.href = res.data.approval_url;
        } else {
          alert("PayPal payment initiation failed. Please try again.");
        }
      })
      .catch(err => {
        console.error("Error:", err.message);
        alert("An error occurred with PayPal payment. Please try again.");
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className='col-md-4'>
      <div className={`card ${styles.card || ''}`}>
        <div className='card-header' style={{ backgroundColor: '#6050DC', color: 'white' }}>
          <h5>Payment Options</h5>
        </div>
        <div className='card-body'>
          {/* PayPal Button */}
          <button 
            className={`btn btn-primary w-100 mb-3 ${styles.paypalButton || ''}`}
            onClick={makePaypalPayment}
            id="paypal-button"
            disabled={loading}
          >
            {loading ? "Processing..." : <><i className='bi bi-paypal'></i> Pay with PayPal</>}
          </button>

          {/* Flutterwave Button */}
          <button 
            className={`btn btn-warning w-100 mb-3 ${styles.flutterwaveButton || ''}`}
            onClick={makeFlutterwavePayment}
            id="flutterwave-button"
            disabled={loading}
          >
            {loading ? "Processing..." : <><i className='bi bi-credit-card'></i> Pay with Flutterwave</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
