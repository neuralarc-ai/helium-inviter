// Admin credentials configuration
export const ADMIN_CREDENTIALS = {
  email: "admin@he2.ai",  // Change this to your desired email
  password: "helium_admin_2024",  // Change this to your desired password
};

// You can also use environment variables
export const getAdminCredentials = () => {
  return {
    email: import.meta.env.VITE_ADMIN_EMAIL || "admin@he2.ai",
    password: import.meta.env.VITE_ADMIN_PASSWORD || "helium_admin_2024",
  };
};
