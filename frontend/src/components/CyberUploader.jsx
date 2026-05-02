import React, { useState } from 'react';
import './CyberUploader.css';

const ImageUploader = ({ onUpload, currentUrl }) => {
  const [preview, setPreview] = useState(currentUrl);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setLoading(true);
      try {
        await onUpload(file);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="cyber-uploader">
      <label className={`cyber-frame ${loading ? 'loading' : ''}`}>
        {preview ? (
          <img src={preview} alt="Vehicle" className="cyber-preview" />
        ) : (
          <div className="cyber-placeholder">
            <span>+</span>
            <p>{loading ? 'UPLOADING...' : 'UPLOAD VEHICLE'}</p>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </label>
    </div>
  );
};

export default ImageUploader;
