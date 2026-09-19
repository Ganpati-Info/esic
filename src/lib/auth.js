const WP_BASE_URL =
  "https://esic.ganpatiinfosolutions.com";

/*
 * =========================================================
 * SESSION EXPIRATION EVENT
 * =========================================================
 */

export function notifySessionExpired() {
  window.dispatchEvent(
    new CustomEvent("esic-session-expired"),
  );
}


/*
 * =========================================================
 * AUTHENTICATED FETCH
 * =========================================================
 *
 * token can be passed directly.
 *
 * This is important during login because the JWT has
 * already been received but has not yet been stored
 * in sessionStorage.
 */

export async function authenticatedFetch(
  url,
  options = {},
  token = null,
) {
  const authToken =
    token ||
    sessionStorage.getItem("esicToken");

  /*
   * No token means there is no authenticated
   * session.
   *
   * Do NOT show the session-expired modal when
   * this is simply an unauthenticated request.
   */
  if (!authToken) {
    throw new Error(
      "Authentication session not found.",
    );
  }

  const headers = new Headers(
    options.headers || {},
  );

  headers.set(
    "Authorization",
    `Bearer ${authToken}`,
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  /*
   * JWT expired or became invalid.
   */
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    /*
     * Only notify the application when we
     * actually had an authenticated token.
     */
    notifySessionExpired();

    throw new Error(
      "Authentication session expired.",
    );
  }

  return response;
}


/*
 * =========================================================
 * LOGIN
 * =========================================================
 */

export async function loginToWordPress(
  username,
  password,
) {
  const params = new URLSearchParams({
    rest_route:
      "/simple-jwt-login/v1/auth",
    username,
    password,
  });

  const response = await fetch(
    `${WP_BASE_URL}/?${params.toString()}`,
    {
      method: "POST",
    },
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Unable to connect to the authentication server.",
    );
  }

  console.log(
    "AUTH STATUS:",
    response.status,
  );

  console.log(
    "AUTH RESPONSE:",
    data,
  );

  if (
    !response.ok ||
    !data?.success
  ) {
    throw new Error(
      data?.data?.message ||
        "Invalid User ID or password.",
    );
  }

  const token = data?.data?.jwt;

  console.log(
    "JWT RECEIVED:",
    !!token,
  );

  if (
    !token ||
    typeof token !== "string"
  ) {
    throw new Error(
      "Authentication succeeded, but no JWT token was returned.",
    );
  }

  return token;
}


/*
 * =========================================================
 * CURRENT USER
 * =========================================================
 */

export async function getCurrentUser(
  token,
) {
  if (!token) {
    throw new Error(
      "Authentication session not found.",
    );
  }

  /*
   * IMPORTANT:
   *
   * Pass the freshly received JWT directly.
   * It has not necessarily been stored in
   * sessionStorage yet.
   */
  const response =
    await authenticatedFetch(
      `${WP_BASE_URL}/graphql`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          query: `
            query Me {
              viewer {
                databaseId
                username
                name

                roles {
                  nodes {
                    name
                    displayName
                  }
                }
              }
            }
          `,
        }),
      },
      token,
    );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Unable to read the user information.",
    );
  }

  console.log(
    "GRAPHQL STATUS:",
    response.status,
  );

  console.log(
    "GRAPHQL RESPONSE:",
    result,
  );

  if (
    !response.ok ||
    result?.errors?.length
  ) {
    throw new Error(
      result?.errors?.[0]?.message ||
        "Unable to fetch authenticated user.",
    );
  }

  if (
    !result?.data?.viewer
  ) {
    throw new Error(
      "Unable to identify the authenticated user.",
    );
  }

  return result.data.viewer;
}