const WP_BASE_URL = "https://esic.ganpatiinfosolutions.com";

export async function getGrievances(token) {
  const response = await fetch(`${WP_BASE_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query GetAllGrievances {
  grievances(first: 100) {
    nodes {
      id
      databaseId
      title
      slug
      date
      modified

      grievanceDetails {
        tokenNumber
        description
        status
      }

      statusLabel
      currentImageUrl
      generatedImageUrl
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
    throw new Error("Unable to read grievance data.");
  }

  console.log("GRIEVANCES STATUS:", response.status);
  console.log("GRIEVANCES RESPONSE:", result);

  if (!response.ok || result?.errors?.length) {
    throw new Error(
      result?.errors?.[0]?.message || "Unable to fetch grievances.",
    );
  }

  return result?.data?.grievances?.nodes || [];
}

/**
 * Create a new grievance.
 *
 * Hospital user:
 * - title
 * - description
 * - current image
 *
 * Status is NOT sent from the frontend.
 * WordPress creates the grievance as Pending.
 */
export async function createGrievance(
  token,
  { title, description, currentImageId = null, generatedImageId = null },
) {
  if (!token) {
    throw new Error("Authentication session not found.");
  }

  const mutation = `
    mutation CreateGrievance($input: CreateGrievanceInput!) {
      createGrievance(input: $input) {
        grievance {
          databaseId
          title
          date
          modified

          grievanceDetails {
            tokenNumber
            description
            status
          }

          statusLabel
          currentImageUrl
          generatedImageUrl
        }
      }
    }
  `;

  const input = {
    clientMutationId: `create-grievance-${Date.now()}`,
    title: title.trim(),
  };

  if (description?.trim()) {
    input.description = description.trim();
  }

  if (currentImageId) {
    input.currentImageId = Number(currentImageId);
  }

  if (generatedImageId) {
    input.generatedImageId = Number(generatedImageId);
  }

  const response = await fetch(`${WP_BASE_URL}/graphql`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      query: mutation,
      variables: {
        input,
      },
    }),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the grievance creation response.");
  }

  console.log("CREATE GRIEVANCE STATUS:", response.status);
  console.log("CREATE GRIEVANCE RESPONSE:", result);

  if (!response.ok) {
    throw new Error("Unable to create grievance.");
  }

  if (result?.errors?.length) {
    throw new Error(result.errors[0]?.message || "Unable to create grievance.");
  }

  const grievance = result?.data?.createGrievance?.grievance;

  if (!grievance) {
    throw new Error("Grievance was not created.");
  }

  return grievance;
}