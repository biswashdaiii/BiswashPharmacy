import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { useAuthStore } from "../store/useAuthStore";
import axios from "axios";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { toast } from "react-toastify";

const MyProfile = () => {
  const { token, backendUrl } = useContext(ShopContext);
  const { authUser: userData, setAuthUser: setUserData } = useAuthStore();
  const [isEdit, setIsEdit] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    address: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(userData?.twoFactorEnabled || false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);

  // TOTP 2FA states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [tempSecret, setTempSecret] = useState("");

  const nepaliCities = [
    "Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar",
    "Birgunj", "Janakpur", "Ghorahi", "Hetauda", "Dhangadhi",
    "Tulsipur", "Itahari", "Nepalgunj", "Butwal", "Dharan",
    "Kalaiya", "Jitpur Simara", "Mechinagar", "Budhanilkantha", "Gokarneshwor"
  ];

  useEffect(() => {
    if (userData) {
      setTwoFactorEnabled(userData.twoFactorEnabled);
    }
  }, [userData]);

  // When entering edit mode, populate form with current data
  const handleEdit = () => {
    setEditData({
      name: userData.name || "",
      phone: userData.phone || "",
      address: typeof userData.address === 'object' ? (userData.address.line1 || "") : (userData.address || ""),
      image: null,
    });
    setImagePreview(
      userData.profileImage
        ? `${backendUrl}/${userData.profileImage}`
        : "/default-profile.png"
    );
    setIsEdit(true);
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData({ ...editData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Validation
    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(editData.name)) {
      alert("Name should only contain letters and be 3-50 characters long.");
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(editData.phone)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }

    const formData = new FormData();
    formData.append("name", editData.name);
    formData.append("email", userData.email); // Required for backend
    formData.append("phone", editData.phone);
    formData.append("address", editData.address);
    if (editData.image) {
      formData.append("image", editData.image);
    }

    try {
      const response = await axios.put(
        `${backendUrl}/api/user/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setUserData(response.data.user);
        setIsEdit(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(
        "Error: " +
        (error.response?.data?.message || "Failed to update profile.")
      );
    }
  };

  const handleToggle2FA = async () => {
    try {
      const newState = !twoFactorEnabled;

      if (newState) {
        // Enabling 2FA - show QR code setup
        const response = await axios.post(
          `${backendUrl}/api/user/setup-2fa`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setQrCodeUrl(response.data.qrCode);
          setTotpSecret(response.data.secret);
          setTempSecret(response.data.tempSecret);
          setShowQRModal(true);
        }
      } else {
        // Disabling 2FA
        const response = await axios.post(
          `${backendUrl}/api/user/disable-2fa`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setTwoFactorEnabled(false);
          setUserData({ ...userData, twoFactorEnabled: false });
          toast.success(response.data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle 2FA");
    }
  };

  const handleVerify2FASetup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/verify-2fa-setup`,
        { token: verificationCode, secret: tempSecret },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTwoFactorEnabled(true);
        setUserData({ ...userData, twoFactorEnabled: true });
        setShowQRModal(false);
        setVerificationCode("");
        setQrCodeUrl("");
        setTotpSecret("");
        setTempSecret("");
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid verification code");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/change-password`,
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };


  if (!userData) {
    return <p className="text-center mt-10">Loading profile...</p>;
  }

  const profileImageUrl = isEdit
    ? imagePreview
    : userData.profileImage
      ? `${backendUrl}/${userData.profileImage}`
      : "/default-profile.png";

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg font-sans">
      <div className="flex flex-col items-center mb-6">
        <img
          src={profileImageUrl}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-4 border-primary"
        />
        {isEdit && (
          <input
            type="file"
            name="image"
            onChange={handleImageChange}
            className="mt-4 text-sm"
          />
        )}
      </div>

      <div className="mb-6">
        {isEdit ? (
          <input
            type="text"
            name="name"
            value={editData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Name"
          />
        ) : (
          <p className="text-2xl font-semibold text-gray-900 text-center">
            {userData.name}
          </p>
        )}
      </div>

      <hr className="my-4" />

      <div className="mb-6">
        <div>
          <p className="text-gray-500 font-medium">Phone:</p>
          {isEdit ? (
            <input
              type="text"
              name="phone"
              maxLength="10"
              value={editData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setEditData({ ...editData, phone: value });
              }}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Phone (10 digits)"
            />
          ) : (
            <p className="text-gray-700">{userData.phone || "Not set"}</p>
          )}
        </div>

        <div className="mt-4">
          <p className="text-gray-500 font-medium">Address:</p>
          {isEdit ? (
            <select
              name="address"
              value={editData.address}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Select City</option>
              {nepaliCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          ) : (
            <p className="text-gray-700">
              {typeof userData.address === 'object'
                ? (userData.address.line1 || userData.address.line2 || "Not set")
                : (userData.address || "Not set")}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {isEdit ? (
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-opacity-90"
          >
            Save Profile
          </button>
        ) : (
          <>
            <button
              onClick={handleEdit}
              className="px-6 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-6 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition"
            >
              Change Password
            </button>
          </>
        )}
      </div>

      <hr className="my-6" />

      {/* Security Section */}
      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-700">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-gray-500">Adds an extra layer of security to your account</p>
          </div>
          <button
            onClick={handleToggle2FA}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${twoFactorEnabled ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-semibold mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Old Password</p>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showOldPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M2 8a10.1 10.1 0 0 1 12.58-6.11M15.42 15.42A9.55 9.55 0 0 1 12 16c-4.42 0-8-4.58-8-9 0-1.42.36-2.72 1-3.82M8.17 8.17a3 3 0 0 1 4.15 4.15M19 8c2.65 1.58 4.13 3.47 5 5-2 4-6 9-11 9-1.68 0-3.27-.55-4.58-1.42M21 16a24.2 24.2 0 0 1-5.63-3.63" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">New Password</p>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M2 8a10.1 10.1 0 0 1 12.58-6.11M15.42 15.42A9.55 9.55 0 0 1 12 16c-4.42 0-8-4.58-8-9 0-1.42.36-2.72 1-3.82M8.17 8.17a3 3 0 0 1 4.15 4.15M19 8c2.65 1.58 4.13 3.47 5 5-2 4-6 9-11 9-1.68 0-3.27-.55-4.58-1.42M21 16a24.2 24.2 0 0 1-5.63-3.63" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={passwordData.newPassword} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirm New Password</p>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M2 8a10.1 10.1 0 0 1 12.58-6.11M15.42 15.42A9.55 9.55 0 0 1 12 16c-4.42 0-8-4.58-8-9 0-1.42.36-2.72 1-3.82M8.17 8.17a3 3 0 0 1 4.15 4.15M19 8c2.65 1.58 4.13 3.47 5 5-2 4-6 9-11 9-1.68 0-3.27-.55-4.58-1.42M21 16a24.2 24.2 0 0 1-5.63-3.63" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Enable Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Scan this QR code with Google Authenticator or any TOTP app
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-64 h-64 border-2 border-gray-200 rounded" />
            </div>


            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500 mb-1">Manual Entry Key:</p>
              <p className="text-sm font-mono break-all text-center">{totpSecret}</p>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify2FASetup} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Enter the 6-digit code from your app to verify:</p>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-3 border border-gray-300 rounded text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary outline-none"
                  placeholder="000000"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQRModal(false);
                    setVerificationCode("");
                    setQrCodeUrl("");
                    setTotpSecret("");
                    setTempSecret("");
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
                >
                  Verify & Enable
                </button>
              </div>
            </form>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
              <p className="font-semibold mb-1">📱 Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download Google Authenticator or any TOTP app</li>
                <li>Scan the QR code above</li>
                <li>Enter the 6-digit code shown in the app</li>
                <li>Keep your phone safe - you'll need it to login</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
