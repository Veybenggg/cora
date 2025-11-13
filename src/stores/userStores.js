import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createDepartment,
  createUsers,
  deleteDepartment,
  fetchDepartment,
  getUser,
  loginUser,
} from "../api/api";
import { setTokens } from "../api/auth";

export const useAuthStore = create(
  persist(
    (set) => ({
      users: [],
      isLoading: false,
      error: null,
      isAuthenticated: false,
      role: null,
      user: null,
      departments: [],
      department: null,
      user_id: null,

      signup: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const newUser = await createUsers(userData);
          set({ isLoading: false, error: null });
          return newUser;
        } catch (err) {
          console.error("Signup error:", err);
          set({ isLoading: false, error: err.message || "Signup failed" });
          throw err;
        }
      },

      fetchUsers: async () => {
        set({ error: null });
        try {
          const users = await getUser();
          set({ users });
        } catch (error) {
          set({ error: "Failed to fetch users" });
          console.error("Error fetching users:", error);
        }
      },

      signin: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const login = await loginUser(userData);
          set({
            isLoading: false,
            error: null,
            isAuthenticated: true,
            role: login.user.role,
            user: login.user.name,
            user_id: login.user.id,
            department: login.user.department,
          });
          return login;
        } catch (err) {
          set({ isLoading: false, error: err.message || "login failed" });
        }
      },

      addDepartment: async (departmentData) => {
        set({ isLoading: true, error: null });
        try {
          const department = await createDepartment(departmentData);
          set({ isLoading: false });
          return department;
        } catch (err) {
          console.error("AddDepartment error", err);
          set({
            isLoading: false,
            error: err.message || "Error creating department",
          });
          throw err;
        }
      },

      getDepartment: async () => {
        set({ error: null });
        try {
          const departments = await fetchDepartment();
          set({ departments, error: null });
        } catch (err) {
          console.error("Error fetching departments", err);
          set({
            error: err.message || "Failed to fetch departments",
            isLoading: false,
          });
        }
      },

      deleteDept: async (id) => {
        try {
          await deleteDepartment(id); // your actual API call
          set((state) => ({
            departments: state.departments.filter((dept) => dept.id !== id),
            error: null,
          }));
          return true; // Explicit success
        } catch (err) {
          console.error("Failed to delete department:", err.message);
          set({ error: err.message });
          throw err; // Let caller handle this
        }
      },

      signout: () => {
        set({
          isAuthenticated: false,
          role: null,
          user: null,
          department: null,
        });
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("document-storage");
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        department: state.department,
        user_id: state.user_id,
      }),
    }
  )
);
