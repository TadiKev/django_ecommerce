import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api";

const PaymentsStatusPage = ({ setNumCartItems }) => {
  const [statusMessage, setStatusMessage] = useState("Verify your payment");
  const [statusSubMessage, setStatusSubMessage] = useState(
    "Wait a moment, your payment is being verified."
  );
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get("status");
    const tsRef = queryParams.get("tx_ref");
    const transactionId = queryParams.get("transaction_id");

    if (status && tsRef && transactionId) {
      api
        .post("/payment_callback/", {
          status,
          tx_ref: tsRef,
          transaction_id: transactionId,
        })
        .then((res) => {
          setStatusMessage(res.data.message || "Payment Verified");
          setStatusSubMessage(
            res.data.subMessage ||
              "Your payment was processed successfully."
          );
          localStorage.removeItem("cart_code");
          setNumCartItems(0);
        })
        .catch(() => {
          setStatusMessage("Payment Failed");
          setStatusSubMessage("There was an issue verifying your payment.");
        });
    }
  }, [location.search, setNumCartItems]);

  return (
    <header className="py-5 payment-status-header">
      <div className="container px-5 px-lg-5 my-5">
        <div className="text-center text-white">
          <h2 className="display-4 fw-bold">{statusMessage}</h2>
          <p className="load fw-normal text-white-75 mb-4">
            {statusSubMessage}
          </p>
          <span>
            <Link to="/profile" className="btn btn-light btn-lg px-4 py-2 mx-3">
              View order details
            </Link>
            <Link to="/" className="btn btn-light btn-lg px-4 py-2">
              Continue shopping
            </Link>
          </span>
        </div>
      </div>
    </header>
  );
};

export default PaymentsStatusPage;
