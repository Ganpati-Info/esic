import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUploadCloud, FiImage, FiX, FiSend } from "react-icons/fi";
import { RiSparkling2Fill } from "react-icons/ri";
import { createGrievance } from "../../lib/grievances";
import { uploadMedia } from "../../lib/media";

async function dataUrlToFile(dataUrl, filename = "ai-reference.png") {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("Unable to prepare the generated image.");
  }

  const blob = await response.blob();

  return new File([blob], filename, {
    type: blob.type || "image/png",
  });
}

function CreateGrievance() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");

  // WordPress media records
  const [currentMedia, setCurrentMedia] = useState(null);
  const [generatedMedia, setGeneratedMedia] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_FILE_SIZE = 3 * 1024 * 1024;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  const handleFile = (file) => {
    setError("");
    setSubmitError("");

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, JPEG and PNG images are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 3 MB.");
      return;
    }

    // If a new image is selected, previous WordPress media
    // and generated image are no longer valid.
    setCurrentMedia(null);
    setGeneratedMedia(null);
    setGeneratedImage("");
    setHasGeneratedImage(false);

    setImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);

    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
    setError("");

    // Clear WordPress media references
    setCurrentMedia(null);
    setGeneratedMedia(null);

    // Clear AI result
    setGeneratedImage("");
    setHasGeneratedImage(false);
  };

  const handleGenerateAI = async () => {
    setSubmitError("");

    if (!title.trim()) {
      setSubmitError("Please enter a complaint title first.");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Please enter a complaint description first.");
      return;
    }

    if (!image) {
      setSubmitError("Please upload an evidence image first.");
      return;
    }

    try {
      setIsGenerating(true);
      setHasGeneratedImage(false);
      setGeneratedImage("");
      setGeneratedMedia(null);

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      /*
       * STEP 1
       * Upload current evidence image to WordPress.
       *
       * If it was already uploaded during a previous
       * generation attempt, reuse the existing media.
       */

      let uploadedMedia = currentMedia;

      if (!uploadedMedia) {
        uploadedMedia = await uploadMedia(token, image);

        console.log("CURRENT MEDIA UPLOAD:", uploadedMedia);

        setCurrentMedia(uploadedMedia);
      } else {
        console.log("REUSING CURRENT MEDIA:", uploadedMedia);
      }

      /*
       * STEP 2
       * Send title, description and WordPress image URL
       * to the AI image generation service.
       */

      const aiResponse = await fetch(
        "https://esicimagegen.vercel.app/api/generate-reference",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            imageUrl: uploadedMedia.url,
          }),
        },
      );

      let aiData;

      try {
        aiData = await aiResponse.json();
      } catch {
        throw new Error("Unable to read the AI service response.");
      }

      console.log("AI SERVICE STATUS:", aiResponse.status);

      console.log("AI SERVICE RESPONSE:", aiData);

      if (!aiResponse.ok) {
        throw new Error(
          aiData?.error || "Unable to generate the desired outcome.",
        );
      }

      if (!aiData?.generatedImage) {
        throw new Error(
          "AI service completed the request but did not return an image.",
        );
      }

      /*
       * STEP 3
       * Convert the AI data URL into a File.
       */

      const generatedFile = await dataUrlToFile(
        aiData.generatedImage,
        `ai-reference-${Date.now()}.png`,
      );

      /*
       * STEP 4
       * Upload the generated AI image to WordPress.
       */

      const generatedMediaUpload = await uploadMedia(token, generatedFile);

      console.log("GENERATED MEDIA UPLOAD:", generatedMediaUpload);

      /*
       * STEP 5
       * Store generated WordPress media record.
       *
       * This ID will later be passed to createGrievance().
       */

      setGeneratedMedia(generatedMediaUpload);

      /*
       * STEP 6
       * Show the generated image in the UI.
       */

      setGeneratedImage(aiData.generatedImage);
      setHasGeneratedImage(true);

      console.log("AI REFERENCE READY:", {
        currentImageId: uploadedMedia.id,
        generatedImageId: generatedMediaUpload.id,
      });
    } catch (error) {
      console.error("AI REFERENCE GENERATION ERROR:", error);

      setHasGeneratedImage(false);
      setGeneratedImage("");
      setGeneratedMedia(null);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to generate the desired outcome.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitError("");

    if (!title.trim()) {
      setSubmitError("Please enter a complaint title.");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Please enter a complaint description.");
      return;
    }

    if (!image) {
      setSubmitError("Please upload an evidence image.");
      return;
    }

    try {
      setIsSubmitting(true);

      const token = sessionStorage.getItem("esicToken");

      if (!token) {
        throw new Error(
          "Authentication session not found. Please log in again.",
        );
      }

      /*
       * STEP 1
       * Make sure the current evidence image exists
       * in WordPress.
       *
       * If AI generation already uploaded it, reuse it.
       * Otherwise upload it now.
       */

      let uploadedMedia = currentMedia;

      if (!uploadedMedia) {
        uploadedMedia = await uploadMedia(token, image);

        console.log("CURRENT MEDIA UPLOAD:", uploadedMedia);

        setCurrentMedia(uploadedMedia);
      } else {
        console.log("REUSING CURRENT MEDIA:", uploadedMedia);
      }

      /*
       * STEP 2
       * Create the grievance.
       *
       * currentImageId = original evidence image
       * generatedImageId = AI repaired-condition image
       */

      const grievance = await createGrievance(token, {
        title: title.trim(),
        description: description.trim(),

        currentImageId: uploadedMedia.id,

        generatedImageId: generatedMedia?.id || null,
      });

      console.log("CREATED GRIEVANCE:", grievance);

      console.log("IMAGE IDS SAVED:", {
        currentImageId: uploadedMedia.id,
        generatedImageId: generatedMedia?.id || null,
      });

      /*
       * STEP 3
       * Go back to grievance list.
       */

      navigate("/hospital/grievances");
    } catch (error) {
      console.error("CREATE GRIEVANCE ERROR:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit grievance. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-grievance-page">
      {/* PAGE HEADER */}

      <div className="create-page-header">
        <div>
          <div className="create-page-eyebrow">HOSPITAL MODULE</div>

          <h1>Create Complaint</h1>

          <p>Report a hospital infrastructure or facility issue.</p>
        </div>
      </div>

      <form className="create-grievance-form" onSubmit={handleSubmit}>
        {/* GRIEVANCE DETAILS */}

        <section className="create-form-card">
          <div className="form-card-header">
            <div>
              <h2>Complaint Details</h2>

              <p>Provide details about the issue you want to report.</p>
            </div>
          </div>

          <div className="form-card-body">
            {/* TITLE */}

            <div className="form-group">
              <label htmlFor="grievance-title">
                Complaint Title
                <span>*</span>
              </label>

              <input
                id="grievance-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter complaint title"
                maxLength={150}
              />

              <div className="input-hint">
                Keep the title short and specific.
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="form-group">
              <label htmlFor="grievance-description">
                Complaint Description
                <span>*</span>
              </label>

              <textarea
                id="grievance-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the issue in detail..."
                rows={7}
                maxLength={2000}
              />

              <div className="character-count">{description.length}/2000</div>
            </div>

            {/* IMAGE UPLOAD */}

            <div className="form-group">
              <label>Evidence Image</label>

              {!imagePreview ? (
                <div
                  className={`upload-area ${isDragging ? "dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileInput}
                    hidden
                  />

                  <div className="upload-icon">
                    <FiUploadCloud size={30} />
                  </div>

                  <div className="upload-title">
                    Drag and drop your image here
                  </div>

                  <div className="upload-or">or</div>

                  <button
                    type="button"
                    className="upload-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <FiImage size={17} />
                    Click to upload
                  </button>

                  <div className="upload-info">
                    JPG, JPEG or PNG • Maximum 3 MB
                  </div>
                </div>
              ) : (
                <div className="uploaded-image-card">
                  <div className="uploaded-image">
                    <img src={imagePreview} alt="Grievance evidence" />
                  </div>

                  <div className="uploaded-image-info">
                    <div className="uploaded-image-name">{image?.name}</div>

                    <div className="uploaded-image-size">
                      {(image?.size / 1024 / 1024).toFixed(3)} MB
                    </div>
                  </div>

                  <button
                    type="button"
                    className="remove-image"
                    onClick={removeImage}
                    aria-label="Remove image"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              )}

              {error && <div className="upload-error">{error}</div>}
            </div>
          </div>
        </section>

        {/* AI REFERENCE IMAGE */}

        <section className="create-form-card ai-reference-card">
          <div className="form-card-header">
            <div className="ai-header-content">
              <div className="ai-icon">
                <RiSparkling2Fill size={20} />
              </div>

              <div>
                <h2>Generate a desired outcome image</h2>

                <p>
                  Generate a visual reference to help explain the reported
                  issue.
                </p>
              </div>
            </div>
          </div>

          <div className="form-card-body">
            <button
              type="button"
              className={`generate-ai-button ${isGenerating ? "disabled" : ""}`}
              onClick={handleGenerateAI}
              disabled={isGenerating}
              aria-busy={isGenerating}
            >
              <RiSparkling2Fill size={16} />

              {isGenerating ? "Generating..." : "Generate Reference Image"}
            </button>

            <div className="ai-result">
              <div className="ai-result-header">
                <div>
                  <h3>Before &amp; After Reference</h3>

                  <p>
                    Compare the reported condition with the expected outcome.
                  </p>
                </div>
              </div>

              <div className="ai-comparison-grid">
                {/* BEFORE */}

                <div className="ai-comparison-card">
                  <div className="ai-comparison-header">
                    <div>
                      <h4>Before</h4>

                      <p>Current Condition</p>
                    </div>
                  </div>

                  <div className="ai-comparison-image-wrapper">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Current condition"
                        className="ai-comparison-image"
                      />
                    ) : (
                      <div className="ai-comparison-placeholder">
                        <FiImage size={30} />

                        <span>Upload an evidence image to preview it here</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AFTER */}

                <div className="ai-comparison-card">
                  <div className="ai-comparison-header">
                    <div>
                      <h4>After</h4>

                      <p>Expected After Repair</p>
                    </div>
                  </div>

                  <div className="ai-comparison-image-wrapper">
                    {generatedImage ? (
                      <img
                        src={generatedImage}
                        alt="Expected repaired condition"
                        className="ai-comparison-image"
                      />
                    ) : (
                      <div className="ai-comparison-placeholder">
                        <RiSparkling2Fill size={30} />

                        <span>
                          {isGenerating
                            ? "Generating repaired-condition reference..."
                            : "Generate an image to preview it here"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {hasGeneratedImage && (
                <div className="ai-comparison-note">
                  <RiSparkling2Fill size={15} />

                  <span>
                    The right image is an AI-generated visual reference showing
                    the expected condition after repair.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SUBMIT ERROR */}

        {submitError && <div className="submit-error">{submitError}</div>}

        {/* SUBMIT */}

        <div className="create-form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/hospital/grievances")}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-grievance-button"
            disabled={isSubmitting}
          >
            <FiSend size={17} />

            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateGrievance;
