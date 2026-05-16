"use client"

import React, { useState, useRef } from 'react';

interface WYSIWYGEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: string;
  documentType?: 'cv' | 'letter' | 'email' | 'reconversion_report';
}

export default function WYSIWYGEditor({
  content,
  onChange,
  language = "fr",
  documentType = "cv"
}: WYSIWYGEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const translations = {
    fr: {
      edit: "Modifier",
      save: "Sauvegarder",
      cancel: "Annuler",
      bold: "Gras",
      italic: "Italique",
      underline: "Souligné",
      list: "Liste",
      link: "Lien",
      color: "Couleur",
      size: "Taille",
      editMode: "Mode édition activé",
      clickToEdit: "Cliquez pour modifier le contenu"
    },
    en: {
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      bold: "Bold",
      italic: "Italic",
      underline: "Underline",
      list: "List",
      link: "Link",
      color: "Color",
      size: "Size",
      editMode: "Edit mode enabled",
      clickToEdit: "Click to edit content"
    },
    nl: {
      edit: "Bewerken",
      save: "Opslaan",
      cancel: "Annuleren",
      bold: "Vet",
      italic: "Cursief",
      underline: "Onderstreept",
      list: "Lijst",
      link: "Link",
      color: "Kleur",
      size: "Grootte",
      editMode: "Bewerkingsmodus ingeschakeld",
      clickToEdit: "Klik om inhoud te bewerken"
    }
  };

  const t = translations[language as keyof typeof translations] || translations.fr;

  const [currentContent, setCurrentContent] = useState(content);

  const handleSave = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setCurrentContent(newContent);
      onChange(newContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = currentContent;
    }
    setIsEditing(false);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const formatText = (command: string, value?: string) => {
    execCommand(command, value);
  };

  const insertList = () => {
    execCommand('insertUnorderedList');
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const changeColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const changeFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  const formatContent = (content: string) => {
    // Convertir les retours à la ligne en <br> pour l'affichage
    return content
      .split('\n')
      .map(line => line.trim())
      .join('<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '&bull;');
  };

  if (!isEditing) {
    return (
      <div className="relative group">
        <div
          className="min-h-32 p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => setIsEditing(true)}
          dangerouslySetInnerHTML={{ __html: formatContent(currentContent) }}
        />

        {/* Overlay d'édition */}
        <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white px-3 py-1 rounded-md shadow-lg border">
            <span className="text-sm text-blue-600 font-medium">✏️ {t.clickToEdit}</span>
          </div>
        </div>

        {/* Bouton d'édition flottant */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="border border-blue-300 rounded-lg bg-white shadow-lg">
      {/* Barre d'outils */}
      <div className="border-b border-gray-200 p-3 bg-gray-50 rounded-t-lg">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Boutons de formatage */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={() => formatText('bold')}
              className="p-2 hover:bg-gray-200 rounded text-sm font-bold"
              title={t.bold}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => formatText('italic')}
              className="p-2 hover:bg-gray-200 rounded text-sm italic"
              title={t.italic}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => formatText('underline')}
              className="p-2 hover:bg-gray-200 rounded text-sm underline"
              title={t.underline}
            >
              U
            </button>
          </div>

          {/* Listes et liens */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={insertList}
              className="p-2 hover:bg-gray-200 rounded text-sm"
              title={t.list}
            >
              • {t.list}
            </button>
            <button
              onClick={insertLink}
              className="p-2 hover:bg-gray-200 rounded text-sm"
              title={t.link}
            >
              🔗
            </button>
          </div>

          {/* Couleurs */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={() => changeColor('#000000')}
              className="w-6 h-6 bg-black rounded border hover:scale-110 transition-transform"
              title="Noir"
            />
            <button
              onClick={() => changeColor('#3B82F6')}
              className="w-6 h-6 bg-blue-500 rounded border hover:scale-110 transition-transform"
              title="Bleu"
            />
            <button
              onClick={() => changeColor('#EF4444')}
              className="w-6 h-6 bg-red-500 rounded border hover:scale-110 transition-transform"
              title="Rouge"
            />
            <button
              onClick={() => changeColor('#10B981')}
              className="w-6 h-6 bg-green-500 rounded border hover:scale-110 transition-transform"
              title="Vert"
            />
          </div>

          {/* Taille de police */}
          <div className="flex gap-1">
            <select
              onChange={(e) => changeFontSize(e.target.value)}
              className="text-sm border rounded px-2 py-1"
              defaultValue="3"
            >
              <option value="1">Très petit</option>
              <option value="2">Petit</option>
              <option value="3">Normal</option>
              <option value="4">Grand</option>
              <option value="5">Très grand</option>
            </select>
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <div className="p-4">
        <div className="mb-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-700">
            ✏️ {t.editMode} - Modifiez le contenu ci-dessous
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          className="min-h-48 p-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          dangerouslySetInnerHTML={{ __html: formatContent(currentContent) }}
          onInput={(e) => {
            const target = e.target as HTMLDivElement;
            setCurrentContent(target.innerHTML);
          }}
          style={{
            lineHeight: '1.6',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Boutons d'action */}
      <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {t.cancel}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}
