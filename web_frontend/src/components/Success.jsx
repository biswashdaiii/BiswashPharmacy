import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base64Decode } from "esewajs";
import axios from "axios";

const Success = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Parse token from URL query parameter "data"
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("data");

  // Decode the base64 token; this returns an object directly
  let decoded = {};
  try {
    decoded = base64Decode(token);
    // If decoded is a string, try to parse it to an object (rare case)
    if (typeof decoded === "string") {
      decoded = JSON.parse(decoded);
    }
  } catch (error) {
    console.error("Failed to decode or parse token:", error);
    decoded = {};
  }

  // Verify payment status by sending transaction_uuid to backend
  const verifyPaymentAndUpdateStatus = async () => {
    console.log("Decoded Data:", decoded);

    if (!decoded.transaction_uuid) {
      console.error("transaction_uuid missing in decoded token");
      setIsLoading(false);
      return;
    }
    console.log("Decoded transaction_uuid:", decoded.transaction_uuid);


    try {
      const response = await axios.post(
        "http://192.168.226.1:5050/payment-status",
        {
          transaction_uuid: decoded.transaction_uuid,
        }
      );
      console.log("Payment verification response:", response);

      if (response.status === 200) {
        setIsSuccess(true);
      } else {
        console.warn("Unexpected status code:", response.status);
      }
    } catch (error) {
      console.error(
        "Error verifying payment:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Run once on component mount
  useEffect(() => {
    verifyPaymentAndUpdateStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && !isSuccess) return <>Loading...</>;
  if (!isLoading && !isSuccess)
    return (
      <>
        <h1>Oops!..Error occurred on confirming payment</h1>
        <h2>We will resolve it soon.</h2>
        <button onClick={() => navigate("/")} className="go-home-button">
          Go to Homepage
        </button>
      </>
    );

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your payment. Your transaction was successful.</p>
      <button onClick={() => navigate("/")} className="go-home-button">
        Go to Homepage
      </button>
    </div>
  );
};

export default Success;
