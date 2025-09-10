// Admin credentials configuration
export const ADMIN_CREDENTIALS = {
  email: "admin@he2.ai",  // Change this to your desired email
  password: "Dx1C9UbwsJIg1T6EP/wIRyFdUFARIoqw8gq2yP/ZH0s=",  // Cryptographically secure password
};

// You can also use environment variables
export const getAdminCredentials = () => {
  return {
    email: import.meta.env.VITE_ADMIN_EMAIL || "admin@he2.ai",
    password: import.meta.env.VITE_ADMIN_PASSWORD || "Dx1C9UbwsJIg1T6EP/wIRyFdUFARIoqw8gq2yP/ZH0s=",
  };
};
