import React, { useState } from 'react';
import { ArrowRight, Music, Image as ImageIcon } from 'lucide-react';

interface ProjectWizardProps {
  onComplete: (data: {
    projectName: string;
    directorName: string;
    stageWidth: number;
    stageHeight: number;
    duration: number;
    bgFile: File | null;
    audioFile: File | null;
    casting: string[];
  }) => void;
  onLoadDemo: () => void;
}

export const ProjectWizard: React.FC<ProjectWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [projectName, setProjectName] = useState<string>('');
  const [directorName, setDirectorName] = useState<string>('');
  
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleNextStep = () => {
    if (step === 1 && !projectName.trim()) {
      alert("Veuillez saisir un nom pour votre projet de spectacle.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    onComplete({
      projectName: projectName.trim(),
      directorName: directorName.trim(),
      stageWidth: 14,
      stageHeight: 10,
      duration: 120,
      bgFile,
      audioFile,
      casting: [], // Empty cast, user adds background actors (figurants) inside the app
    });
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-card glass-panel" style={{ border: '1px solid rgba(99, 102, 241, 0.15)' }}>
        
        {/* Header decoration */}
        <div className="wizard-header">
          <div className="wizard-logo">🎭</div>
          <h2>StagePath</h2>
          <p className="wizard-subtitle">Planificateur Spatiotemporel de Scène</p>
        </div>

        {/* Steps progress indicator */}
        <div className="wizard-steps-indicator" style={{ justifyContent: 'center', gap: '24px' }}>
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1. Général</div>
          <div className="step-line" style={{ flex: 'none', width: '80px', background: step >= 2 ? 'linear-gradient(90deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.08)' }} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2. Médias</div>
        </div>

        {/* Scrollable Form Content */}
        <div className="wizard-form-scroll">
          {step === 1 && (
            <div className="wizard-step-content animate-fade-in">
              <h3 className="step-title">Créer votre nouveau projet</h3>
              
              <div className="wizard-form-group">
                <label>Nom du spectacle / projet *</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ex: Roméo & Juliette - Acte II"
                  className="glass-input w-full"
                  required
                />
              </div>

              <div className="wizard-form-group">
                <label>Chorégraphe / Metteur en scène</label>
                <input 
                  type="text" 
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="Ex: Maurice Béjart"
                  className="glass-input w-full"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step-content animate-fade-in">
              <h3 className="step-title">Médias de scène (Optionnels)</h3>
              
              {/* Background image dropzone */}
              <div className="wizard-form-group">
                <label className="flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-cyan-400" /> Plan de la scène (Vue de dessus)
                </label>
                <div className={`media-dropzone ${bgFile ? 'has-file' : ''}`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="bg-upload-wizard"
                    onChange={(e) => setBgFile(e.target.files?.[0] || null)}
                    className="hidden-file-input"
                  />
                  <label htmlFor="bg-upload-wizard" className="dropzone-label">
                    <span className="dropzone-icon">🖼️</span>
                    <span className="dropzone-text font-medium text-xs">
                      {bgFile ? (
                        <span className="text-emerald-400 block truncate max-w-[400px]" title={bgFile.name}>{bgFile.name}</span>
                      ) : (
                        "Cliquez pour téléverser votre plan de scène (JPG, PNG, SVG)"
                      )}
                    </span>
                  </label>
                  {bgFile && (
                    <button type="button" onClick={() => setBgFile(null)} className="clear-file-btn">Retirer</button>
                  )}
                </div>
              </div>

              {/* Audio soundtrack dropzone */}
              <div className="wizard-form-group">
                <label className="flex items-center gap-1.5">
                  <Music size={13} className="text-indigo-400" /> Bande-son (Synchronisation musicale)
                </label>
                <div className={`media-dropzone ${audioFile ? 'has-file' : ''}`}>
                  <input 
                    type="file" 
                    accept="audio/*" 
                    id="audio-upload-wizard"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden-file-input"
                  />
                  <label htmlFor="audio-upload-wizard" className="dropzone-label">
                    <span className="dropzone-icon">🎵</span>
                    <span className="dropzone-text font-medium text-xs">
                      {audioFile ? (
                        <span className="text-emerald-400 block truncate max-w-[400px]" title={audioFile.name}>{audioFile.name}</span>
                      ) : (
                        "Cliquez pour téléverser la bande-son de l'acte (MP3, WAV)"
                      )}
                    </span>
                  </label>
                  {audioFile && (
                    <button type="button" onClick={() => setAudioFile(null)} className="clear-file-btn">Retirer</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer Actions */}
        <div className="wizard-footer-actions">
          {step === 1 ? (
            <>
              <div /> {/* Espaceur pour pousser le bouton Suivant à droite */}
              
              <button 
                onClick={handleNextStep} 
                className="btn-primary flex items-center gap-1.5"
                type="button"
              >
                Suivant <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handlePrevStep} 
                className="btn-secondary"
                type="button"
              >
                Retour
              </button>
              
              <button 
                onClick={handleSubmit} 
                className="btn-primary flex items-center gap-1.5 font-bold"
                type="button"
              >
                Créer le spectacle 🎉
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
