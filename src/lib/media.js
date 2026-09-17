const WP_BASE_URL = "https://esic.ganpatiinfosolutions.com";

export async function uploadMedia(token, file) {
  if (!token) {
    throw new Error("Authentication session not found.");
  }

  if (!file) {
    throw new Error("Please select an image.");
  }

  const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        file.name,
      )}"`,
    },
    body: file,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Unable to read the image upload response.");
  }

  console.log("MEDIA UPLOAD STATUS:", response.status);
  console.log("MEDIA UPLOAD RESPONSE:", data);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.code || "Unable to upload the evidence image.",
    );
  }

  if (!data?.id) {
    throw new Error("Image uploaded, but no attachment ID was returned.");
  }

  return {
    id: data.id,
    url: data.source_url || "",
    title: data.title?.rendered || file.name,
  };
}
