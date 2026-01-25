import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ShopContext } from "../context/ShopContext";
import { useAuthStore } from "../store/useAuthStore";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleLogin } from '@react-oauth/google';
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

const Login = () => {
  const { backendUrl, token, setToken, navigate } = useContext(ShopContext);

  const [state, setState] = useState("Sign up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [userIdForOTP, setUserIdForOTP] = useState(null);
  const recaptchaRef = useRef();

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const url =
      state === "Sign up"
        ? backendUrl + "/api/user/register"
        : backendUrl + "/api/user/login";

    // Frontend Validation for Sign up
    if (state === "Sign up") {
      const nameRegex = /^[a-zA-Z\s]{3,50}$/;
      if (!nameRegex.test(name)) {
        toast.error("Name should only contain letters and be 3-50 characters long.");
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~])[A-Za-z\d!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]{8,}$/;
      if (!passwordRegex.test(password)) {
        toast.error("Password must be 8+ characters and include uppercase, lowercase, number, and special character.");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match!");
        return;
      }
    }

    const payload =
      state === "Sign up"
        ? {
          name,
          email,
          password,
          gender: "Not Selected",
          dob: "Not selected",
          phone: "0000000000",
          address: "",
          recaptchaToken
        }
        : { email, password, recaptchaToken };

    try {
      const res = await axios.post(url, payload);
      console.log("Success:", res.data);

      if (state === "Sign up") {
        toast.success("Account created successfully! Please login.");
        setState("Login");
        setPassword("");
        setRecaptchaToken("");
        recaptchaRef.current?.reset();
        if (res.data.requires2FA) {
          setShowOTP(true);
          setUserIdForOTP(res.data.userId);
          toast.info(res.data.message || "Please enter the verification code sent to your email");
          return;
        }

        if (res.data.token && res.data.user) {
          setToken(res.data.token);
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user)); // ✅ Store user info
          const { setAuthUser, connectSocket } = useAuthStore.getState();
          setAuthUser(res.data.user);
          connectSocket();

          toast.success("Login successful!");
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      toast.error(
        "Failed: " + (error.response?.data?.message || error.message)
      );
      // Reset reCAPTCHA on error
      setRecaptchaToken("");
      recaptchaRef.current?.reset();
    }
  };

  // Handle OAuth callback from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const userFromUrl = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Google Sign-In failed. Please try again.');
      // Clean URL
      window.history.replaceState({}, document.title, '/login');
    } else if (tokenFromUrl && userFromUrl) {
      try {
        const user = JSON.parse(decodeURIComponent(userFromUrl));
        setToken(tokenFromUrl);
        localStorage.setItem('token', tokenFromUrl);
        localStorage.setItem('user', JSON.stringify(user));

        const { setAuthUser, connectSocket } = useAuthStore.getState();
        setAuthUser(user);
        connectSocket();

        toast.success('Google Sign-In successful!');
        navigate('/');
      } catch (err) {
        console.error('Error parsing OAuth response:', err);
        toast.error('Authentication error. Please try again.');
      }
      // Clean URL
      window.history.replaceState({}, document.title, '/login');
    }
  }, [setToken, navigate]);

  const handleGoogleSignIn = () => {
    window.location.href = `${backendUrl}/api/user/auth/google`;
  };

  const onVerifyOTPHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/api/user/verify-otp`, {
        userId: userIdForOTP,
        otp
      });

      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        const { setAuthUser, connectSocket } = useAuthStore.getState();
        setAuthUser(res.data.user);
        connectSocket();

        toast.success("Login successful!");
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid verification code");
    }
  };

  const onResendOTP = async () => {
    try {
      await axios.post(`${backendUrl}/api/user/resend-otp`, { userId: userIdForOTP });
      toast.success("Verification code resent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover
        theme="colored"
      />

      {showOTP ? (
        <form
          onSubmit={onVerifyOTPHandler}
          className="min-h-[100vh] flex items-center"
        >
          <div className="flex flex-col gap-3 m-auto items-center p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
            <p className="text-2xl font-semibold text-primary">Two-Factor Authentication</p>
            <p className="text-center">Please enter the 6-digit verification code sent to your email.</p>

            <div className="w-full mt-4">
              <input
                className="border border-zinc-300 rounded w-full p-4 text-center text-2xl tracking-[1em] focus:border-primary outline-none"
                type="text"
                maxLength="6"
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
                placeholder="000000"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-primary text-white w-full py-2 rounded-md text-base mt-4 hover:bg-opacity-90 transition"
            >
              Verify Code
            </button>

            <div className="flex flex-col items-center gap-2 mt-4">
              <p className="text-gray-500">Didn't receive code?</p>
              <button
                type="button"
                onClick={onResendOTP}
                className="text-primary hover:underline"
              >
                Resend Verification Code
              </button>
              <button
                type="button"
                onClick={() => setShowOTP(false)}
                className="text-gray-400 text-xs mt-2 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form
          onSubmit={onSubmitHandler}
          className="min-h-[100vh] flex items-center"
        >
          <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
            <p className="text-2xl font-semibold">
              {state === "Sign up" ? "Create Account" : "Login"}
            </p>
            <p>
              Please {state === "Sign up" ? "sign up" : "login"} to shop for medicines
            </p>

            {state === "Sign up" && (
              <>
                <div className="w-full">
                  <p>Full Name</p>
                  <input
                    className="border border-zinc-300 rounded w-full p-2 mt-1"
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </>
            )}

            <div className="w-full">
              <p>Email</p>
              <input
                className="border border-zinc-300 rounded w-full p-2 mt-1"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>

            <div className="w-full">
              <p>Password</p>
              <div className="relative">
                <input
                  className="border border-zinc-300 rounded w-full p-2 mt-1"
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-[55%] -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M2 8a10.1 10.1 0 0 1 12.58-6.11M15.42 15.42A9.55 9.55 0 0 1 12 16c-4.42 0-8-4.58-8-9 0-1.42.36-2.72 1-3.82M8.17 8.17a3 3 0 0 1 4.15 4.15M19 8c2.65 1.58 4.13 3.47 5 5-2 4-6 9-11 9-1.68 0-3.27-.55-4.58-1.42M21 16a24.2 24.2 0 0 1-5.63-3.63" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {state === "Sign up" && (
              <div className="w-full">
                <p>Confirm Password</p>
                <div className="relative">
                  <input
                    className="border border-zinc-300 rounded w-full p-2 mt-1"
                    type={showConfirmPassword ? "text" : "password"}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-[55%] -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M2 8a10.1 10.1 0 0 1 12.58-6.11M15.42 15.42A9.55 9.55 0 0 1 12 16c-4.42 0-8-4.58-8-9 0-1.42.36-2.72 1-3.82M8.17 8.17a3 3 0 0 1 4.15 4.15M19 8c2.65 1.58 4.13 3.47 5 5-2 4-6 9-11 9-1.68 0-3.27-.55-4.58-1.42M21 16a24.2 24.2 0 0 1-5.63-3.63" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {state === "Sign up" && <PasswordStrengthMeter password={password} />}


            {/* reCAPTCHA */}
            <div className="w-full flex justify-center my-3">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken("")}
              />
            </div>

            <button
              type="submit"
              className="bg-primary text-white w-full py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              {state === "Sign up" ? "Create Account" : "Login"}
            </button>

            {/* Divider */}
            <div className="flex items-center w-full my-3">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {state === "Sign up" ? (
              <p>
                Already have an account?{" "}
                <span
                  onClick={() => setState("Login")}
                  className="text-primary underline cursor-pointer"
                >
                  Login here
                </span>
              </p>
            ) : (
              <p>
                Create a new account?{" "}
                <span
                  onClick={() => setState("Sign up")}
                  className="text-primary underline cursor-pointer"
                >
                  Click here
                </span>
              </p>
            )}
          </div>
        </form>
      )}
    </>
  );
};

export default Login;
