const WP_BASE_URL = "https://esic.ganpatiinfosolutions.com";

export async function loginToWordPress(username, password) {
  const params = new URLSearchParams({
    rest_route: "/simple-jwt-login/v1/auth",
    username,
    password,
  });

  const response = await fetch(`${WP_BASE_URL}/?${params.toString()}`, {
    method: "POST",
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Unable to connect to the authentication server.");
  }

  console.log("AUTH STATUS:", response.status);
  console.log("AUTH RESPONSE:", data);

  if (!response.ok || !data?.success) {
    throw new Error(data?.data?.message || "Invalid User ID or password.");
  }

  const token = data?.data?.jwt;

  console.log("JWT RECEIVED:", !!token);

  if (!token || typeof token !== "string") {
    throw new Error("Authentication succeeded, but no JWT token was returned.");
  }

  return token;
}

export async function getCurrentUser(token) {
  const response = await fetch(`${WP_BASE_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the user information.");
  }

  console.log("GRAPHQL STATUS:", response.status);
  console.log("GRAPHQL RESPONSE:", result);

  if (!response.ok || result?.errors?.length) {
    throw new Error(
      result?.errors?.[0]?.message || "Unable to fetch authenticated user.",
    );
  }

  if (!result?.data?.viewer) {
    throw new Error("Unable to identify the authenticated user.");
  }

  return result.data.viewer;
}
