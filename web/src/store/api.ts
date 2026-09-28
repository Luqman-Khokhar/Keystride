import { createApi, fetchBaseQuery, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { SerializedError } from "@reduxjs/toolkit";
import type { ResultSubmission } from "@keystride/engine";
import type {
  ApiErrorBody,
  HistoryPage,
  Leaderboard,
  Profile,
  SubmitResponse,
  Summary,
  User,
} from "./types";

/** Put the signed-in user straight into the getMe cache so the header updates instantly. */
async function setMeOnSuccess(
  _arg: unknown,
  { dispatch, queryFulfilled }: { dispatch: (action: unknown) => unknown; queryFulfilled: Promise<{ data: User }> },
) {
  try {
    const { data: user } = await queryFulfilled;
    dispatch(api.util.upsertQueryData("getMe", undefined, user));
  } catch {
    // Failed sign-in: the form shows the error; nothing to cache.
  }
}

/** Same-origin: Next.js proxies /api/* to the Express server. */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "same-origin" }),
  tagTypes: ["Me", "History", "Summary", "Leaderboard", "Profile"],
  endpoints: (b) => ({
    getMe: b.query<User | null, void>({
      // Signed out → { user: null }, not an error.
      query: () => "/auth/me",
      transformResponse: (r: { user: User | null }) => r.user,
      providesTags: ["Me"],
    }),
    register: b.mutation<User, { email: string; username: string; password: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (r: { user: User }) => r.user,
      onQueryStarted: setMeOnSuccess,
      invalidatesTags: ["History", "Summary", "Leaderboard"],
    }),
    login: b.mutation<User, { identifier: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (r: { user: User }) => r.user,
      onQueryStarted: setMeOnSuccess,
      invalidatesTags: ["History", "Summary", "Leaderboard"],
    }),
    logout: b.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST", body: {} }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        // Drop every cached per-user response.
        dispatch(api.util.resetApiState());
      },
    }),
    submitResult: b.mutation<SubmitResponse, ResultSubmission>({
      query: (body) => ({ url: "/results", method: "POST", body }),
      invalidatesTags: ["History", "Summary", "Leaderboard", "Profile"],
    }),
    getHistory: b.infiniteQuery<HistoryPage, void, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (last) => last.nextCursor,
      },
      query: ({ pageParam }) =>
        `/results/me?limit=20${pageParam ? `&before=${encodeURIComponent(pageParam)}` : ""}`,
      providesTags: ["History"],
    }),
    getSummary: b.query<Summary, void>({
      query: () => "/results/me/summary",
      providesTags: ["Summary"],
    }),
    getLeaderboard: b.query<Leaderboard, 15 | 60>({
      query: (amount) => `/leaderboard?mode=time&amount=${amount}`,
      providesTags: ["Leaderboard"],
    }),
    getProfile: b.query<Profile, string>({
      query: (username) => `/users/${encodeURIComponent(username)}`,
      providesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useSubmitResultMutation,
  useGetHistoryInfiniteQuery,
  useGetSummaryQuery,
  useGetLeaderboardQuery,
  useGetProfileQuery,
} = api;

type AnyError = FetchBaseQueryError | SerializedError | undefined;

export function errorMessage(err: AnyError, fallback = "Something went wrong"): string {
  if (!err) return fallback;
  if ("status" in err) {
    if (err.status === "FETCH_ERROR") return "Can't reach the server. Check your connection.";
    const body = err.data as ApiErrorBody | undefined;
    return body?.error ?? fallback;
  }
  return err.message ?? fallback;
}

export function fieldErrors(err: AnyError): Record<string, string> {
  if (err && "status" in err) return (err.data as ApiErrorBody | undefined)?.details?.fields ?? {};
  return {};
}

export function errorStatus(err: AnyError): number | string | undefined {
  return err && "status" in err ? err.status : undefined;
}
