import React, { useState } from "react";
import type { ChangeEvent } from "react";
import "./Lobby.css";

// Tüm metinler için Poppins fontunu uygula
// Ekstra className'ler ile spacing ve modern efektler için alan açıyorum

type LobbyProps = {
  handleSessionStart: (imageBase64: string) => void;
};

export const Lobby: React.FC<LobbyProps> = ({ handleSessionStart }) => {
  const [topic, setTopic] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [materialImages, setMaterialImages] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handleClick = () => {
    if (materialImages.length > 0) {
      handleSessionStart(materialImages[0]);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArr = Array.from(files);
      fileArr.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setMaterialImages((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (idx: number) => {
    setMaterialImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="lobby-container poppins-font">
      <img
        src="/assets/character_smiling.png"
        alt="Karakter"
        className="lobby-avatar lobby-avatar-glow"
      />
      <h1 className="lobby-title lobby-title-spacing">Bugün Neye Çalışıyoruz?</h1>
      <div className="lobby-input-floating-container">
        <input
          className="lobby-input lobby-input-spacing"
          type="text"
          id="study-topic-input"
          value={topic}
          onChange={handleInputChange}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          autoComplete="off"
        />
        <label
          htmlFor="study-topic-input"
          className={
            "lobby-input-label" +
            ((inputFocused || topic) ? " lobby-input-label--active" : "")
          }
        >
          Örn: Biyoloji - Hücreler
        </label>
      </div>
      <div className="lobby-upload-container">
        <label className="lobby-upload-label">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
            multiple
          />
          <span className="lobby-upload-btn">Ders Materyali Görseli Yükle</span>
        </label>
        {materialImages.length > 0 && (
          <div className="lobby-upload-preview-multi">
            {materialImages.map((img, idx) => (
              <div className="lobby-upload-preview" key={idx}>
                <img src={img} alt={`Materyal ${idx + 1}`} />
                <button
                  className="lobby-upload-remove"
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label="Görseli Kaldır"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        className="lobby-button lobby-button-glow"
        disabled={!topic.trim()}
        onClick={handleClick}
        type="button"
      >
        Haydi Başlayalım!
      </button>
    </div>
  );
}; 