"use client"

import React, { useState, useRef } from 'react';

interface PhotoUploaderProps {
  onPhotoUpload: (photoUrl: string) => void;
  currentPhoto?: string;
  language?: string;
}

export default function PhotoUploader({ onPhotoUpload, currentPhoto, language = "fr" }: PhotoUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    fr: {
      title: "Photo de profil",
      subtitle: "Ajoutez votre photo au CV (optionnel)",
      dragDrop: "Glissez-déposez votre photo ici",
      or: "ou",
      browse: "Parcourir",
      formats: "PNG, JPG • Max 2MB",
      uploading: "Upload en cours...",
      remove: "Supprimer",
      change: "Changer",
      error: "Erreur lors de l'upload",
      success: "Photo ajoutée avec succès !",
      tips: "Conseils: Photo professionnelle recommandée, format carré idéal 300x300px"
    },
    en: {
      title: "Profile photo",
      subtitle: "Add your photo to the CV (optional)",
      dragDrop: "Drag and drop your photo here",
      or: "or",
      browse: "Browse",
      formats: "PNG, JPG • Max 2MB",
      uploading: "Uploading...",
      remove: "Remove",
      change: "Change",
      error: "Upload error",
      success: "Photo added successfully!",
      tips: "Tips: Professional photo recommended, square format ideal 300x300px"
    },
    nl: {
      title: "Profielfoto",
      subtitle: "Voeg uw foto toe aan het CV (optioneel)",
      dragDrop: "Sleep uw foto hierheen",
      or: "of",
      browse: "Bladeren",
      formats: "PNG, JPG • Max 2MB",
      uploading: "Uploaden...",
      remove: "Verwijderen",
      change: "Wijzigen",
      error: "Upload fout",
      success: "Foto succesvol toegevoegd!",
      tips: "Tips: Professionele foto aanbevolen, vierkant formaat ideaal 300x300px"
    }
  };

  const t = translations[language as keyof typeof translations] || translations.fr;

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Vérifications
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('Le fichier est trop volumineux (max 2MB)');
      return;
    }

    setUploading(true);

    // Convertir en data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onPhotoUpload(dataUrl);
      setUploading(false);
    };
    reader.onerror = () => {
      alert(t.error);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removePhoto = () => {
    onPhotoUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {t.title}
        </h3>
        <p className="text-sm text-gray-600">
          {t.subtitle}
        </p>
      </div>

      {currentPhoto ? (
        // Affichage de la photo actuelle
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
            <img
              src={currentPhoto}
              alt="Photo de profil"
              className="w-24 h-24 mx-auto object-cover rounded-full border-2 border-gray-300"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {t.change}
            </button>
            <button
              onClick={removePhoto}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              {t.remove}
            </button>
          </div>
        </div>
      ) : (
        // Zone d'upload
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600">{t.uploading}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl text-gray-400">📷</div>
              <div>
                <p className="text-gray-600 mb-2">
                  {t.dragDrop}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {t.or}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t.browse}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {t.formats}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Conseils */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <span className="text-blue-600 mr-2">💡</span>
          <p className="text-sm text-blue-700">
            {t.tips}
          </p>
        </div>
      </div>
    </div>
  );
}
