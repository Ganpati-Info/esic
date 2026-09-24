import { authenticatedFetch } from "./auth";

const WP_BASE_URL = "https://esic.ganpatiinfosolutions.com";

export async function getHospitals(token) {
  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
        query GetHospitalUsers {
          users(first: 100) {
            nodes {
              databaseId
              username
              name
              email
              hospitalCode
              roles {
                nodes {
                  name
                  displayName
                }
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
    throw new Error("Unable to read hospital data.");
  }

  if (!response.ok || result?.errors?.length) {
    throw new Error(
      result?.errors?.[0]?.message || "Unable to fetch hospitals.",
    );
  }

  const users = result?.data?.users?.nodes || [];

  const hospitalUsers = users.filter((user) => {
    const isHospitalUser = user.roles?.nodes?.some(
      (role) => role.name === "hospital_user",
    );

    return isHospitalUser && user.hospitalCode;
  });

  /*
   * One hospital = one code.
   *
   * During testing we still have old accounts such as:
   * esic_joka -> MNTL
   * esic_maniktala -> MNTL
   *
   * Prefer the new esih_* account when duplicates exist.
   */
  const hospitalMap = new Map();

  hospitalUsers.forEach((user) => {
    const code = String(user.hospitalCode).toUpperCase();

    const existing = hospitalMap.get(code);

    if (!existing) {
      hospitalMap.set(code, user);
      return;
    }

    const existingIsNewAccount = existing.username?.startsWith("esih_");

    const currentIsNewAccount = user.username?.startsWith("esih_");

    if (!existingIsNewAccount && currentIsNewAccount) {
      hospitalMap.set(code, user);
    }
  });

  return Array.from(hospitalMap.values())
    .sort((a, b) =>
      String(a.hospitalCode).localeCompare(String(b.hospitalCode)),
    )
    .map((user) => ({
      id: user.databaseId,
      code: String(user.hospitalCode).toUpperCase(),
      name: user.name || "Unnamed Hospital",
      username: user.username,
      email: user.email || "N/A",
    }));
}

export async function updateHospital(token, hospitalId, hospitalData) {
  const response = await authenticatedFetch(
    `${WP_BASE_URL}/wp-json/esic/v1/hospitals/${hospitalId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: hospitalData.name,
        email: hospitalData.email,
        password: hospitalData.password || "",
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read server response.");
  }

  if (!response.ok || result?.code) {
    throw new Error(result?.message || "Unable to update hospital.");
  }

  return result;
}