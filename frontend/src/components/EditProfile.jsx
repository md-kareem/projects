import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  Check,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Loader2,
  Send,
  Unlock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentRole = user?.role?.toLowerCase() || "";
  const isRestrictedRole =
    currentRole === "worker" ||
    currentRole === "dept" ||
    currentRole === "official";
  const basePath = currentRole === "admin" ? "/admin" : "/dashboard";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    password: "",
  });

  const [isFetching, setIsFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ONE-TIME UNLOCK STATES
  const [requestStatus, setRequestStatus] = useState("None"); // None, Pending, Approved, Denied
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // If role is restricted AND request isn't approved, lock the form!
  const isFormLocked = isRestrictedRole && requestStatus !== "Approved";

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch Profile Data
        const response = await fetch("http://localhost:8000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const dbUser = await response.json();
          setFormData({
            fullName: dbUser.full_name || dbUser.name || "",
            email: dbUser.email || "",
            phone:
              dbUser.phone_number ||
              dbUser.phone ||
              dbUser.phone_no ||
              dbUser.mobile ||
              "",
            city: dbUser.city || "",
            state: dbUser.state || "",
            password: "",
          });
        }

        // Fetch Edit Request Status (To see if Admin unlocked them)
        if (isRestrictedRole) {
          const statusRes = await fetch(
            "http://localhost:8000/api/auth/edit-request/status",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setRequestStatus(statusData.status);
          }
        }
      } catch (error) {
        console.error("Failed to sync with database:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfileData();
  }, [isRestrictedRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isFormLocked) return;

    setIsSaving(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/auth/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          phone: formData.phone,
          city: formData.city,
          state: formData.state,
          password: formData.password ? formData.password : undefined,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        // Instant Lock-Out: Reset status so the form greys out immediately after saving
        setRequestStatus("None");
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setErrorMsg(errorData.detail || "Failed to update database.");
      }
    } catch (err) {
      setErrorMsg("Network error during transmission.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestReason.trim()) return;
    setIsSubmittingRequest(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/auth/request-edit",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: requestReason }),
        },
      );

      if (response.ok) {
        setRequestStatus("Pending"); // Automatically flip UI to pending state
        setShowRequestForm(false);
        setRequestReason("");
      } else {
        setErrorMsg("Failed to transmit request to Command Center.");
      }
    } catch (error) {
      setErrorMsg("Network error during transmission.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Decrypting Identity Record...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8 border-b border-zinc-800/80 pb-5">
        <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-inner">
          <User className="text-emerald-500" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest text-shadow-sm">
            Identity Profile
          </h2>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
            Manage User Credentials
          </p>
        </div>
      </div>

      <div className="vault-card p-6 md:p-8 border border-zinc-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-xl bg-zinc-950/80 backdrop-blur-xl">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-emerald-500/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative group overflow-hidden">
            <span className="text-3xl font-bold text-emerald-400">
              {formData.fullName.charAt(0) || "U"}
            </span>
            {!isFormLocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[10px] font-mono text-white uppercase tracking-widest">
                  Edit
                </span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-zinc-200 uppercase tracking-wide">
            {formData.fullName || "Authorized User"}
          </h3>
          <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-mono text-emerald-500 uppercase tracking-widest mt-2">
            Role: {user?.role || "Citizen"}
          </span>
        </div>

        {/* RESTRICTED / UNLOCKED BANNER UI */}
        {isRestrictedRole && (
          <div className="mb-8 flex flex-col gap-4">
            {requestStatus === "Approved" ? (
              <div className="p-4 bg-emerald-950/30 border-l-4 border-emerald-500 rounded-r-lg flex items-start gap-3 shadow-lg">
                <Unlock
                  className="text-emerald-500 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    Editing Authorized
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider leading-relaxed">
                    Command Center has temporarily unlocked your profile. You
                    may update your credentials. This permission will be
                    securely revoked immediately after saving.
                  </p>
                </div>
              </div>
            ) : requestStatus === "Pending" ? (
              <div className="p-4 bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg flex items-start gap-3 shadow-lg">
                <ShieldAlert
                  className="text-amber-500 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
                    Editing Restricted
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider leading-relaxed mb-3">
                    Profile edits require direct authorization from the Command
                    Center Administrator.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded border border-emerald-900/50">
                    <Check size={12} /> Authorization Request Transmitted
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg flex items-start gap-3 shadow-lg">
                <ShieldAlert
                  className="text-amber-500 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
                    Editing Restricted
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider leading-relaxed">
                    Profile edits require direct authorization from the Command
                    Center Administrator.
                  </p>

                  {requestStatus === "Denied" && (
                    <p className="text-[10px] font-mono text-red-400 uppercase tracking-wider mt-2 mb-2 font-bold">
                      Your previous request was denied.
                    </p>
                  )}

                  {!showRequestForm && (
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="mt-3 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded border border-amber-500/50 transition-colors flex items-center gap-2"
                    >
                      <Send size={12} />{" "}
                      {requestStatus === "Denied"
                        ? "Request Again"
                        : "Request Edit Authorization"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {showRequestForm && (
              <form
                onSubmit={handleSendRequest}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-top-2 shadow-inner"
              >
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-2">
                  Reason for Profile Modification Request:
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="E.g., I have been issued a new departmental contact number..."
                  className="w-full h-24 bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all font-mono resize-none mb-3"
                  required
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest || !requestReason.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-2 transition-colors shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  >
                    {isSubmittingRequest ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-950/30 border-l-2 border-red-500 rounded-r-lg flex items-center gap-2">
            <span className="text-xs font-mono text-red-400 uppercase tracking-wider">
              {errorMsg}
            </span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Full Legal Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isFormLocked}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} /> Contact Email (Locked)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={true}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-500 outline-none transition-all cursor-not-allowed text-sm"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} /> Registered Device Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isFormLocked}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-200 focus:border-emerald-500 outline-none transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Regional Jurisdiction
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isFormLocked}
                  placeholder="City"
                  className="w-1/2 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-200 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 text-sm"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isFormLocked}
                  placeholder="State"
                  className="w-1/2 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3.5 text-zinc-200 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 text-sm"
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="md:col-span-2 space-y-2 mt-4 pt-6 border-t border-zinc-800/50">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                Security Passcode Update
              </label>
              <p className="text-[10px] font-mono text-zinc-600 mb-2">
                Leave blank to keep current passcode.
              </p>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isFormLocked}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-4 pr-12 py-3.5 text-zinc-200 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter new passcode..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLocked}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:hover:text-zinc-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-zinc-800/50 mt-8">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="px-6 py-4 rounded-lg font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800 flex-1 flex justify-center items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Hub
            </button>

            <button
              type="submit"
              disabled={isFormLocked || isSaving || saveSuccess}
              className={`flex-1 px-6 py-4 rounded-lg font-bold font-mono text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                saveSuccess
                  ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900"
                  : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin text-zinc-900" />{" "}
                  Updating Data...
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} /> Profile Saved
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;