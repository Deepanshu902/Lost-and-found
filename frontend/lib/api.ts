const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb("refreshed"));
  refreshSubscribers = [];
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${BACKEND_URL}${cleanPath}`;

  // Ensure options.credentials is set to "include"
  options.credentials = "include";

  let response = await fetch(url, options);

  // If unauthorized and not a login/refresh request
  if (
    response.status === 401 &&
    !cleanPath.includes("users/login") &&
    !cleanPath.includes("users/refresh-token")
  ) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(fetch(url, options));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${BACKEND_URL}users/refresh-token`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        isRefreshing = false;
        onRefreshed();
        return fetch(url, options);
      } else {
        isRefreshing = false;
        // If refresh fails, clear storage and log out
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return response;
      }
    } catch (error) {
      isRefreshing = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return response;
    }
  }

  return response;
}
