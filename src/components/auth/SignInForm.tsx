import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { LoginAdminService } from "../../services/loginAdmin/loginAdmin.services";
import { SocketService } from "../../services/socket/socket";
import { LOCAL_STORAGE_KEYS } from "../../constants/localStorage";
import toastHelper from "../../utils/toastHelper";

// Validation schema
const signInSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: yup.boolean().default(false),
});

type SignInFormData = yup.InferType<typeof signInSchema>;

export default function SignInForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<SignInFormData>({
    resolver: yupResolver(signInSchema),
    mode: "onChange", // Validate on change to show errors as user types
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setSubmitting(true);
      const credentials = {
        email: data.email,
        password: data.password,
      };
      const response = await LoginAdminService.loginAdmin(credentials);

      // Check if login was successful and token exists
      if (response.status === 200 && response.token) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, response.token);
        
        // Store permissions if available
        let permissionsToStore = null;
        if (response.permissions) {
          permissionsToStore = response.permissions;
        } else if (response.data?.permissions) {
          permissionsToStore = response.data.permissions;
        } else if (response.data?.data?.permissions) {
          permissionsToStore = response.data.data.permissions;
        }
        
        if (permissionsToStore) {
          console.log('Storing permissions from login:', permissionsToStore);
          localStorage.setItem('adminPermissions', JSON.stringify(permissionsToStore));
          localStorage.setItem('adminRole', permissionsToStore.role || 'admin');
          
          // Dispatch event to notify sidebar to update immediately
          window.dispatchEvent(new Event('permissionsUpdated'));
        } else {
          console.warn('No permissions found in login response. Full response:', response);
        }
        
        // Connect socket after login
        try { SocketService.connect(); } catch {}
        navigate("/home");
      } else {
        // Show error in top-right toast only
        const errorMessage = response.message || "Login failed. Please check your credentials.";
        toastHelper.showTost(errorMessage, "error");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred. Please try again.";
      // Show error in top-right toast only
      toastHelper.showTost(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto"></div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="email"
                    value={watch("email")}
                    onChange={(e) => {
                      setValue("email", e.target.value);
                      trigger("email"); // Trigger validation on change
                    }}
                    onBlur={() => trigger("email")} // Also validate on blur
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <i className="fas fa-exclamation-triangle text-xs"></i>
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={watch("password")}
                      onChange={(e) => {
                        setValue("password", e.target.value);
                        trigger("password"); // Trigger validation on change
                      }}
                      onBlur={() => trigger("password")} // Also validate on blur
                      error={!!errors.password}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <i className="fas fa-exclamation-triangle text-xs"></i>
                      {errors.password.message}
                    </p>
                  )}
                </div>
                {/* <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={watch("rememberMe") || false} 
                      onChange={(checked) => setValue("rememberMe", checked)}
                    />
                  </div> */}
                  {/* <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link> */}
                {/* </div> */}
                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg shadow-theme-xs bg-[#0071E0] hover:bg-[#005bb8] disabled:opacity-60"
                  >
                    {submitting ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </div>
            </form>
            {/* <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}