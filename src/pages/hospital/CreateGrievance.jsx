import { useRef, useState } from "react";
import { FiUploadCloud, FiImage, FiX, FiSend } from "react-icons/fi";
import { RiSparkling2Fill } from "react-icons/ri";

function CreateGrievance() {
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedImage, setHasGeneratedImage] = useState(false);

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  const handleFile = (file) => {
    setError("");

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, JPEG and PNG images are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 2 MB.");
      return;
    }

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
  };

  const handleGenerateAI = () => {
    setIsGenerating(true);

    // Keep the predefined-prompt integration point until the image API is connected.
    setTimeout(() => {
      setHasGeneratedImage(true);
      setIsGenerating(false);
    }, 800);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    console.log({
      title,
      description,
      image,
      aiReferenceImageGenerated: hasGeneratedImage,
    });

    alert("Grievance submitted successfully.");
  };

  return (
    <div className="create-grievance-page">
      {/* PAGE HEADER */}

      <div className="create-page-header">
        <div>
          <div className="create-page-eyebrow">HOSPITAL MODULE</div>

          <h1>Create Grievance</h1>

          <p>Report a hospital infrastructure or facility issue.</p>
        </div>
      </div>

      <form className="create-grievance-form" onSubmit={handleSubmit}>
        {/* GRIEVANCE DETAILS */}

        <section className="create-form-card">
          <div className="form-card-header">
            <div>
              <h2>Grievance Details</h2>

              <p>Provide details about the issue you want to report.</p>
            </div>
          </div>

          <div className="form-card-body">
            {/* TITLE */}

            <div className="form-group">
              <label htmlFor="grievance-title">
                Grievance Title
                <span>*</span>
              </label>

              <input
                id="grievance-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter grievance title"
                maxLength={150}
              />

              <div className="input-hint">
                Keep the title short and specific.
              </div>
            </div>

            {/* DESCRIPTION */}

            <div className="form-group">
              <label htmlFor="grievance-description">
                Grievance Description
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
                    JPG, JPEG or PNG • Maximum 2 MB
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
                      {(image?.size / 1024 / 1024).toFixed(2)} MB
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
                <h2>Generate AI Reference Image</h2>

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
              className="generate-ai-button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Reference Image"}
            </button>

            <div className="ai-result">
              <div className="ai-result-header">
                <div>
                  <h3>Generated Reference</h3>

                  <p>
                    {hasGeneratedImage
                      ? "Generated image preview is ready."
                      : "The generated image will appear here."}
                  </p>
                </div>

                <span className="ai-generated-badge">AI Reference</span>
              </div>

              <div className="ai-image-wrapper ai-image-placeholder">
                <RiSparkling2Fill size={30} />
                <span>
                  {hasGeneratedImage
                    ? "Generated image preview"
                    : "Generate an image to preview it here"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT */}

        <div className="create-form-actions">
          <button type="button" className="cancel-button">
            Cancel
          </button>

          <button type="submit" className="submit-grievance-button">
            <FiSend size={17} />
            Submit Grievance
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateGrievance;
