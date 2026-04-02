import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import {
  clearClientUserData,
  clearStoredTokens,
  getStoredAccessToken,
  resetClientUserDataOnSessionChange,
} from "../utils/sessionData";

/* SIGNUP */
export const signUpUser = createAsyncThunk(
  "auth/signup",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("users/signup/", data);
      return res.data;
    } catch (err) {
      const data = err.response?.data;
      return rejectWithValue(data && typeof data === "object" ? data : data || "Signup failed");
    }
  }
);

/* LOGIN */
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("token/", data);
      resetClientUserDataOnSessionChange(res.data.access);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      await dispatch(fetchProfile()).unwrap();
      return res.data;
    } catch (err) {
      clearClientUserData();
      clearStoredTokens();
      const contentType = err?.response?.headers?.["content-type"] || "";
      const detail =
        err?.response?.data?.detail ||
        err?.userMessage ||
        (contentType.includes("application/json") ? "Invalid credentials" : "Login failed");
      return rejectWithValue(detail);
    }
  }
);

/* PROFILE */
export const fetchProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("users/profile/");
      return res.data;
    } catch (err) {
      return rejectWithValue({
        status: err.response?.status,
        data: err.response?.data || "Cannot fetch profile",
      });
    }
  }
);

export const updatePreferences = createAsyncThunk(
  "auth/updatePreferences",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put("users/profile/", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Cannot update profile");
    }
  }
);

/* AVATAR UPLOAD */
export const uploadUserPhoto = createAsyncThunk(
  "auth/uploadPhoto",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await api.patch("users/profile/", formData);
      return res.data;
    } catch {
      return rejectWithValue("Avatar upload failed");
    }
  }
);

/* INITIAL STATE - Rehydrate from localStorage */
const storedToken = getStoredAccessToken();
const initialState = {
  user: null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

/* SLICE */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      clearClientUserData();
      clearStoredTokens();
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.token = action.payload.access;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.data || action.payload || "Cannot fetch profile";

        const status = action.payload?.status ?? action.error?.status;
        if (status === 401 || status === 403) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          clearClientUserData();
        }
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        if (state.user) {
          state.user.preferences = action.payload;
        }
      })
      .addCase(uploadUserPhoto.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logoutUser, setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
