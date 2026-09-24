import { authenticatedFetch } from "./auth";
const WP_BASE_URL = "https://esic.ganpatiinfosolutions.com";

export async function getGrievances(token) {
  const response = await authenticatedFetch(`${WP_BASE_URL}/graphql`, {
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
      creator {
        userId
        username
        name
      }
      grievanceDetails {
        tokenNumber
        description
        status
      }
      statusLabel
      priority
      currentImageUrl
      generatedImageUrl
      rejectionRemark
      timeline {
        id
        eventType
        title
        description
        eta
        createdAt
        createdBy
        createdByName
        createdByUsername
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
          rejectionRemark
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

  const response = await authenticatedFetch(`${WP_BASE_URL}/graphql`, {
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

export async function updateGrievanceStatus(
  token,
  { grievanceId, status, rejectionRemark = "" },
) {
  if (!token) {
    throw new Error("Authentication session not found.");
  }

  if (!grievanceId) {
    throw new Error("Grievance ID is required.");
  }

  if (!status) {
    throw new Error("Grievance status is required.");
  }

  /*
   * WPGraphQL uses the global node ID.
   * Your current IDs follow:
   * post:185 -> cG9zdDoxODU=
   */
  const numericId = Number(grievanceId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid grievance ID.");
  }

  const graphqlId = window.btoa(`post:${numericId}`);

  const mutation = `
    mutation UpdateGrievance($input: UpdateGrievanceInput!) {
      updateGrievance(input: $input) {
        grievance {
          databaseId
          modified
          grievanceDetails {
            status
          }
          statusLabel
          rejectionRemark
        }
      }
    }
  `;

  const input = {
    clientMutationId: `status-update-${numericId}-${Date.now()}`,
    id: graphqlId,
    grievanceStatus: status,
  };

  if (status === "rejected") {
    const trimmedRemark = rejectionRemark.trim();

    if (!trimmedRemark) {
      throw new Error(
        "A rejection remark is required when rejecting a grievance.",
      );
    }

    input.rejectionRemark = trimmedRemark;
  }

  const response = await authenticatedFetch(`${WP_BASE_URL}/graphql`, {
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
    throw new Error("Unable to read the status update response.");
  }

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.message || "Unable to update grievance status.",
    );
  }

  if (result?.errors?.length) {
    throw new Error(
      result.errors[0]?.message || "Unable to update grievance status.",
    );
  }

  const grievance = result?.data?.updateGrievance?.grievance;

  if (!grievance) {
    throw new Error("Grievance status was not updated.");
  }

  return grievance;
}

export async function addGrievanceProgressUpdate(
  token,
  { grievanceId, title, description, eta },
) {
  if (!token) {
    throw new Error("Authentication session not found. Please log in again.");
  }

  const response = await authenticatedFetch(`${WP_BASE_URL}/graphql`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      query: `
          mutation AddGrievanceProgressUpdate(
            $input: AddGrievanceProgressUpdateInput!
          ) {
            addGrievanceProgressUpdate(
              input: $input
            ) {
              timelineEvent {
                id
                eventType
                title
                description
                eta
                createdAt
                createdBy
                createdByName
                createdByUsername
              }
            }
          }
        `,

      variables: {
        input: {
          grievanceId: Number(grievanceId),
          title: title.trim(),
          description: description?.trim() || "",
          eta: eta || null,
        },
      },
    }),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the progress update response.");
  }

  if (!response.ok || result?.errors?.length) {
    throw new Error(
      result?.errors?.[0]?.message || "Unable to add progress update.",
    );
  }

  const timelineEvent = result?.data?.addGrievanceProgressUpdate?.timelineEvent;

  if (!timelineEvent) {
    throw new Error(
      "Progress update was created but no timeline event was returned.",
    );
  }

  return timelineEvent;
}

export async function updateGrievancePriority(token, grievanceId, priority) {
  if (!token) {
    throw new Error("Authentication session not found.");
  }

  const numericId = Number(grievanceId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid grievance ID.");
  }

  const graphqlId = window.btoa(`post:${numericId}`);

  const mutation = `
    mutation UpdateGrievancePriority($input: UpdateGrievanceInput!) {
      updateGrievance(input: $input) {
        grievance {
          databaseId
          modified
          priority
        }
      }
    }
  `;

  const input = {
    clientMutationId: `priority-update-${numericId}-${Date.now()}`,
    id: graphqlId,
    priority: Boolean(priority),
  };

  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input,
        },
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the priority update response.");
  }

  if (!response.ok || result?.errors?.length) {
    throw new Error(
      result?.errors?.[0]?.message || "Unable to update grievance priority.",
    );
  }

  const grievance = result?.data?.updateGrievance?.grievance;

  if (!grievance) {
    throw new Error("Grievance priority was not updated.");
  }

  return grievance;
}