import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  persistReducer,
  persistStore,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { adminApi } from "./api/adminApi";
import { adminPaymentsApi } from "./api/adminPaymentsApi";
import { applicationsApi } from "./api/applicationsApi";
import { authApi } from "./api/authApi";
import { billingApi } from "./api/billingApi";
import { companiesApi } from "./api/companiesApi";
import { freelancerApi } from "./api/freelancerApi";
import { jobsApi } from "./api/jobsApi";
import { notificationsApi } from "./api/notificationsApi";
import { plansApi } from "./api/plansApi";
import { savedJobsApi } from "./api/savedJobsApi";
import { usersApi } from "./api/usersApi";
import authReducer from "./slices/authSlice";

// 1. Server-safe Storage Engine for Next.js
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: string) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

// 2. Combine Reducers (Add your actual reducers here)
const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [jobsApi.reducerPath]: jobsApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [companiesApi.reducerPath]: companiesApi.reducer,
  [applicationsApi.reducerPath]: applicationsApi.reducer,
  [savedJobsApi.reducerPath]: savedJobsApi.reducer,
  [notificationsApi.reducerPath]: notificationsApi.reducer,
  [billingApi.reducerPath]: billingApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
  [adminPaymentsApi.reducerPath]: adminPaymentsApi.reducer,
  [plansApi.reducerPath]: plansApi.reducer,
  [freelancerApi.reducerPath]: freelancerApi.reducer,
});

// 3. Persist Config
const persistConfig = {
  key: "root",
  storage,
  // Only the persisted-auth hint is saved — never RTK Query caches.
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Configure Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required to prevent Redux warnings regarding persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      jobsApi.middleware,
      usersApi.middleware,
      companiesApi.middleware,
      applicationsApi.middleware,
      savedJobsApi.middleware,
      notificationsApi.middleware,
      billingApi.middleware,
      adminApi.middleware,
      adminPaymentsApi.middleware,
      plansApi.middleware,
      freelancerApi.middleware,
    ),
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);

// 5. Types & Hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
