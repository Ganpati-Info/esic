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
        budget
        mediaId
        mediaUrl
        mediaType
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

export async function createGrievanceSchedulePlan(
  token,
  { grievanceId, title, description, budget, mediaId, eta },
) {
  const variables = {
    input: {
      grievanceId: Number(grievanceId),
      title,
      description,
      budget:
        budget !== "" && budget !== null && budget !== undefined
          ? Number(budget)
          : null,
      mediaId:
        mediaId !== "" && mediaId !== null && mediaId !== undefined
          ? Number(mediaId)
          : null,
      eta,
    },
  };

  console.log("CREATE SCHEDULE PLAN VARIABLES:", variables);

  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation CreateGrievanceSchedulePlan(
            $input: CreateGrievanceSchedulePlanInput!
          ) {
            createGrievanceSchedulePlan(
              input: $input
            ) {
              status

              timelineEvent {
                id
                eventType
                title
                description
                budget
                mediaId
                mediaUrl
                mediaType
                eta
                createdAt
                createdBy
                createdByName
                createdByUsername
              }
            }
          }
        `,
        variables,
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read schedule plan response.");
  }

  console.log("CREATE SCHEDULE PLAN STATUS:", response.status);

  console.log("CREATE SCHEDULE PLAN RESPONSE:", result);

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.message ||
        result?.message ||
        `Schedule plan request failed with status ${response.status}.`,
    );
  }

  if (result?.errors?.length) {
    console.error("CREATE SCHEDULE PLAN GRAPHQL ERRORS:", result.errors);

    throw new Error(
      result.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | ") || "Unable to create the schedule plan.",
    );
  }

  const payload = result?.data?.createGrievanceSchedulePlan;

  if (!payload) {
    throw new Error("Schedule plan mutation returned no data.");
  }

  if (!payload.timelineEvent) {
    throw new Error("Schedule plan was not created.");
  }

  return {
    status: payload.status,
    timelineEvent: payload.timelineEvent,
  };
}

export async function resolveGrievance(
  token,
  { grievanceId, resolutionRemark, mediaId },
) {
  if (!token) {
    throw new Error("Authentication session not found. Please log in again.");
  }

  const numericGrievanceId = Number(grievanceId);
  const numericMediaId = Number(mediaId);

  if (!Number.isInteger(numericGrievanceId) || numericGrievanceId <= 0) {
    throw new Error("Invalid grievance ID.");
  }

  if (!Number.isInteger(numericMediaId) || numericMediaId <= 0) {
    throw new Error("Resolution evidence is required.");
  }

  const trimmedRemark = String(resolutionRemark || "").trim();

  if (!trimmedRemark) {
    throw new Error("A resolution remark is required.");
  }

  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation ResolveGrievance(
            $input: ResolveGrievanceInput!
          ) {
            resolveGrievance(
              input: $input
            ) {
              status

              timelineEvent {
                id
                eventType
                title
                description
                budget
                mediaId
                mediaUrl
                mediaType
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
            grievanceId: numericGrievanceId,
            resolutionRemark: trimmedRemark,
            mediaId: numericMediaId,
          },
        },
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the resolution response.");
  }

  console.log("RESOLVE GRIEVANCE STATUS:", response.status);

  console.log("RESOLVE GRIEVANCE RESPONSE:", result);

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.message ||
        result?.message ||
        `Resolution request failed with status ${response.status}.`,
    );
  }

  if (result?.errors?.length) {
    throw new Error(
      result.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | ") || "Unable to resolve grievance.",
    );
  }

  const payload = result?.data?.resolveGrievance;

  if (!payload) {
    throw new Error("Resolution mutation returned no data.");
  }

  if (!payload.timelineEvent) {
    throw new Error("Grievance was not resolved.");
  }

  return {
    status: payload.status,
    timelineEvent: payload.timelineEvent,
  };
}

export async function returnGrievanceToHospital(
  token,
  { grievanceId, remark },
) {
  if (!token) {
    throw new Error("Authentication session not found. Please log in again.");
  }

  const numericGrievanceId = Number(grievanceId);

  if (!Number.isInteger(numericGrievanceId) || numericGrievanceId <= 0) {
    throw new Error("Invalid grievance ID.");
  }

  const trimmedRemark = String(remark || "").trim();

  if (!trimmedRemark) {
    throw new Error("A return remark is required.");
  }

  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        query: `
          mutation ReturnGrievanceToHospital(
            $input: ReturnGrievanceToHospitalInput!
          ) {
            returnGrievanceToHospital(
              input: $input
            ) {
              status

              timelineEvent {
                id
                eventType
                title
                description
                budget
                mediaId
                mediaUrl
                mediaType
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
            grievanceId: numericGrievanceId,
            remark: trimmedRemark,
          },
        },
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the return grievance response.");
  }

  console.log("RETURN GRIEVANCE STATUS:", response.status);

  console.log("RETURN GRIEVANCE RESPONSE:", result);

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.message ||
        result?.message ||
        `Request failed with status ${response.status}.`,
    );
  }

  if (result?.errors?.length) {
    throw new Error(
      result.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | ") || "Unable to return grievance to hospital.",
    );
  }

  const payload = result?.data?.returnGrievanceToHospital;

  if (!payload) {
    throw new Error("Return grievance mutation returned no data.");
  }

  if (!payload.timelineEvent) {
    throw new Error("Grievance was not returned to the hospital.");
  }

  return {
    status: payload.status,
    timelineEvent: payload.timelineEvent,
  };
}

export async function sendGrievanceToEsic(token, { grievanceId }) {
  if (!token) {
    throw new Error("Authentication session not found. Please log in again.");
  }

  const numericGrievanceId = Number(grievanceId);

  if (!Number.isInteger(numericGrievanceId) || numericGrievanceId <= 0) {
    throw new Error("Invalid grievance ID.");
  }

  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        query: `
          mutation SendGrievanceToEsic(
            $input: SendGrievanceToEsicInput!
          ) {
            sendGrievanceToEsic(
              input: $input
            ) {
              status

              timelineEvent {
                id
                eventType
                title
                description
                budget
                mediaId
                mediaUrl
                mediaType
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
            grievanceId: numericGrievanceId,
          },
        },
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the ESIC submission response.");
  }

  console.log("SEND TO ESIC STATUS:", response.status);

  console.log("SEND TO ESIC RESPONSE:", result);

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.message ||
        result?.message ||
        `Request failed with status ${response.status}.`,
    );
  }

  if (result?.errors?.length) {
    throw new Error(
      result.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | ") || "Unable to send grievance to ESIC.",
    );
  }

  const payload = result?.data?.sendGrievanceToEsic;

  if (!payload) {
    throw new Error("Send to ESIC mutation returned no data.");
  }

  if (!payload.timelineEvent) {
    throw new Error("Grievance was not sent to ESIC.");
  }

  return {
    status: payload.status,
    timelineEvent: payload.timelineEvent,
  };
}

export async function updateReturnedGrievance(
  token,
  { grievanceId, title, description },
) {
  if (!token) {
    throw new Error("Authentication session not found. Please log in again.");
  }

  const numericGrievanceId = Number(grievanceId);

  if (!Number.isInteger(numericGrievanceId) || numericGrievanceId <= 0) {
    throw new Error("Invalid grievance ID.");
  }

  const trimmedTitle = String(title || "").trim();

  const trimmedDescription = String(description || "").trim();

  if (!trimmedTitle) {
    throw new Error("Complaint title is required.");
  }

  if (!trimmedDescription) {
    throw new Error("Complaint description is required.");
  }

  const response = await authenticatedFetch(
    `${WP_BASE_URL}/graphql`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        query: `
            mutation UpdateReturnedGrievance(
              $input: UpdateReturnedGrievanceInput!
            ) {
              updateReturnedGrievance(
                input: $input
              ) {
                title
                description
                modified
              }
            }
          `,

        variables: {
          input: {
            grievanceId: numericGrievanceId,

            title: trimmedTitle,

            description: trimmedDescription,
          },
        },
      }),
    },
    token,
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Unable to read the grievance update response.");
  }

  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.message ||
        `Request failed with status ${response.status}.`,
    );
  }

  if (result?.errors?.length) {
    throw new Error(
      result.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | ") || "Unable to update grievance.",
    );
  }

  const payload = result?.data?.updateReturnedGrievance;

  if (!payload) {
    throw new Error("Grievance update returned no data.");
  }

  return {
    title: payload.title,
    description: payload.description,
    modified: payload.modified,
  };
}