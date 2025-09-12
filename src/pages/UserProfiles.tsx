import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import { UserProfileService } from "../services/adminProfile/adminProfile.services";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfiles() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await UserProfileService.getProfile();
        if (response.status === 200 && response.data) {
          setFormData((prev) => ({
            ...prev,
            name: response.data.name || "",
            email: response.data.email || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin"
        description="Profile Dashboard page for TailAdmin"
      />
      <PageBreadcrumb pageTitle="Profile" />

      <div className="dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-6">
          {/* <UserMetaCard name={formData.name} /> */}
          <UserInfoCard
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
          />
        </div>
      </div>
    </>
  );
}