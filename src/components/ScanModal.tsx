import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Flame,
  CheckCircle,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { compressImageFile, compressDataUrl } from '../utils/imageUtils';
import { analyzeFoodImage } from '../services/nutritionApi';
import { AnalyzeFoodResponse } from '../types/nutrition';
import { SAMPLE_FOOD_OPTIONS, generateSampleFoodDataUrl } from '../data/sampleFoods';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisSuccess: (result: AnalyzeFoodResponse, imageBase64: string) => void;
}

type ModalMode = 'select' | 'camera' | 'preview' | 'denied';

interface PendingPhoto {
  base64: string;
  mimeType: string;
  dataUrl: string;
  source: 'camera' | 'upload' | 'sample';
  hint?: string;
}

export const ScanModal: React.FC<Props> = ({ isOpen, onClose, onAnalysisSuccess }) => {
  const [mode, setMode] = useState<ModalMode>('select');
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Scanning image features...');
  const [error, setError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks and release hardware
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setMode('select');
      setPendingPhoto(null);
      setIsAnalyzing(false);
      setError(null);
    }
  }, [isOpen]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  /**
   * Request camera permission and start video stream ONLY when user taps "Take Photo"
   */
  const handleStartCamera = async (facing: 'environment' | 'user' = 'environment') => {
    stopCameraStream();
    setError(null);

    // Check if getUserMedia is supported in the browser environment
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported in this context; opening native camera input');
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        setMode('denied');
      }
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setMode('camera');

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => {
          console.warn('Video playback notice:', playErr);
        });
      }
    } catch (err: any) {
      console.warn('Camera permission or stream error:', err);
      stopCameraStream();

      const errorName = err.name || '';
      if (
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        err.message?.toLowerCase().includes('permission') ||
        err.message?.toLowerCase().includes('denied')
      ) {
        // User denied camera permission or blocked by browser settings
        setMode('denied');
      } else {
        // Fall back directly to Android/iOS native camera capture
        if (nativeCameraInputRef.current) {
          nativeCameraInputRef.current.click();
        } else {
          setError(err.message || 'Unable to access camera. Please use the upload option.');
        }
      }
    }
  };

  const switchCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    handleStartCamera(next);
  };

  /**
   * Capture photo frame from live camera viewfinder
   */
  const capturePhotoFromStream = async () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      // Stop camera stream immediately to conserve power
      stopCameraStream();

      // Compress and set preview
      const { base64, mimeType } = await compressDataUrl(rawDataUrl);
      const compressedDataUrl = `data:${mimeType};base64,${base64}`;

      setPendingPhoto({
        base64,
        mimeType,
        dataUrl: compressedDataUrl,
        source: 'camera',
      });
      setMode('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to capture photo from camera');
    }
  };

  /**
   * Handle Photo taken via Android/Mobile Native Camera App
   */
  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const { base64, mimeType } = await compressImageFile(file);
      const dataUrl = `data:${mimeType};base64,${base64}`;

      setPendingPhoto({
        base64,
        mimeType,
        dataUrl,
        source: 'camera',
      });
      setMode('preview');
    } catch (err: any) {
      setError('Could not process the captured photo. Please try again.');
    } finally {
      if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
    }
  };

  /**
   * Handle File Upload from Gallery/Device
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const { base64, mimeType } = await compressImageFile(file);
      const dataUrl = `data:${mimeType};base64,${base64}`;

      setPendingPhoto({
        base64,
        mimeType,
        dataUrl,
        source: 'upload',
      });
      setMode('preview');
    } catch (err: any) {
      setError('Could not process the selected image. Please try a different photo.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Handle Sample Food Presets
   */
  const handleSampleSelected = async (sample: typeof SAMPLE_FOOD_OPTIONS[0]) => {
    setError(null);
    try {
      const rawDataUrl = generateSampleFoodDataUrl(sample);
      const { base64, mimeType } = await compressDataUrl(rawDataUrl);
      const dataUrl = `data:${mimeType};base64,${base64}`;

      setPendingPhoto({
        base64,
        mimeType,
        dataUrl,
        source: 'sample',
        hint: sample.hint,
      });
      setMode('preview');
    } catch (err: any) {
      setError('Failed to load sample meal: ' + err.message);
    }
  };

  /**
   * User confirms: "Use This Photo" -> triggers AI food analysis
   */
  const handleConfirmUsePhoto = async () => {
    if (!pendingPhoto) return;
    await processImageAnalysis(
      pendingPhoto.base64,
      pendingPhoto.mimeType,
      pendingPhoto.dataUrl,
      pendingPhoto.hint
    );
  };

  /**
   * Retake photo
   */
  const handleRetake = () => {
    const prevSource = pendingPhoto?.source;
    setPendingPhoto(null);
    setError(null);

    if (prevSource === 'camera') {
      handleStartCamera(cameraFacing);
    } else if (prevSource === 'upload') {
      fileInputRef.current?.click();
    } else {
      setMode('select');
    }
  };

  /**
   * Execute Analysis with animated progress stages
   */
  const processImageAnalysis = async (
    base64: string,
    mimeType: string,
    previewUrl: string,
    hint?: string
  ) => {
    setIsAnalyzing(true);
    setError(null);

    const step1 = setTimeout(() => setAnalysisStep('Scanning food plate and ingredients...'), 500);
    const step2 = setTimeout(() => setAnalysisStep('Detecting individual food items...'), 1400);
    const step3 = setTimeout(() => setAnalysisStep('Estimating portion sizes and cooking methods...'), 2400);
    const step4 = setTimeout(() => setAnalysisStep('Calculating calories & macronutrient profile...'), 3500);

    try {
      const result = await analyzeFoodImage(base64, mimeType, hint);
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);

      setIsAnalyzing(false);
      onClose();
      onAnalysisSuccess(result, previewUrl);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(step4);
      setIsAnalyzing(false);
      setError(err.message || 'Analysis failed. Please ensure the image is clear and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-base">
              📷
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">
                {mode === 'preview'
                  ? 'Confirm Your Photo'
                  : mode === 'denied'
                  ? 'Camera Access'
                  : mode === 'camera'
                  ? 'Take Food Photo'
                  : 'Scan My Food'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'preview'
                  ? 'Review photo before analyzing nutrition'
                  : mode === 'denied'
                  ? 'Enable camera permission in Android Chrome'
                  : mode === 'camera'
                  ? 'Frame your plate and snap'
                  : 'Take a photo or upload to analyze nutrition'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Analysis Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {isAnalyzing ? (
            /* Analyzing State */
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-100 flex items-center justify-center relative overflow-hidden bg-emerald-50/50 shadow-inner">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse -translate-y-8" />
                  <Flame className="w-10 h-10 text-emerald-600 animate-bounce" />
                </div>
                <div className="absolute -inset-1 rounded-full border-2 border-emerald-400/40 animate-ping opacity-75" />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h3 className="font-bold text-slate-800 text-lg">Analyzing your meal…</h3>
                <p className="text-xs text-emerald-700 font-medium animate-pulse">
                  {analysisStep}
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  NUTRISNAP AI is identifying items, estimating portions, and calculating nutrition breakdown.
                </p>
              </div>

              <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-2/3 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            </div>
          ) : mode === 'preview' && pendingPhoto ? (
            /* PREVIEW SCREEN with "Use This Photo" */
            <div className="space-y-4">
              <div className="relative aspect-4/3 sm:aspect-16/9 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
                <img
                  src={pendingPhoto.dataUrl}
                  alt="Captured food preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Photo Captured
                </div>
              </div>

              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between">
                <span>Photo ready for AI food & calorie estimation.</span>
                <span className="font-semibold text-emerald-700">Clear & in-focus</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full sm:w-1/3 py-3.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleConfirmUsePhoto}
                  className="w-full sm:w-2/3 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Use This Photo & Analyze
                </button>
              </div>
            </div>
          ) : mode === 'camera' ? (
            /* LIVE CAMERA VIEWFINDER */
            <div className="space-y-4">
              <div className="relative aspect-4/3 bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target overlay guide */}
                <div className="absolute inset-8 border-2 border-white/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[11px] text-white/80 font-medium drop-shadow-sm">
                    <span>Frame your food</span>
                    <span>Plate / Bowl</span>
                  </div>
                  <div className="text-center text-[11px] text-white/80 font-medium drop-shadow-sm">
                    Hold steady with clear lighting
                  </div>
                </div>

                {/* Camera Switch button */}
                <button
                  type="button"
                  onClick={switchCameraFacing}
                  className="absolute top-3 right-3 p-2.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition shadow-md"
                  title="Flip camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setMode('select');
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={capturePhotoFromStream}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <Camera className="w-5 h-5" />
                  Capture Photo
                </button>
              </div>
            </div>
          ) : mode === 'denied' ? (
            /* CAMERA PERMISSION DENIED SCREEN WITH DETAILED ANDROID CHROME INSTRUCTIONS */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-slate-800">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  Camera Permission Required
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Camera access is currently blocked. To allow NutriSnap AI to take photos directly from your browser:
                </p>

                {/* Android Chrome Step-by-Step Instructions */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-800">
                    How to enable camera in Chrome on Android:
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        Tap the <strong>tune / settings icon</strong> (or <strong>lock icon 🔒</strong>) on the left side of the <strong>Chrome address bar</strong>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>
                        Tap <strong>Permissions</strong> (or <strong>Site settings</strong>).
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>
                        Find <strong>Camera</strong> and toggle it to <strong>Allow</strong>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        4
                      </span>
                      <span>
                        Return here and tap <strong>Try Camera Again</strong> below.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Denied State */}
              <div className="space-y-2 pt-1">
                {/* 1. Try Camera Again */}
                <button
                  type="button"
                  onClick={() => handleStartCamera(cameraFacing)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Camera Again
                </button>

                {/* 2. Open Phone Camera Directly (Native system camera app) */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Camera className="w-4 h-4" />
                  Open Phone Camera App
                </button>

                {/* 3. Upload from Gallery fallback */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo from Gallery Instead
                </button>

                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-medium text-center"
                >
                  Back to Options
                </button>
              </div>
            </div>
          ) : (
            /* SELECTION MODE: Take Photo vs Upload vs Sample Meals */
            <div className="space-y-5">
              {/* Primary 2 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Take Photo Button (Prompts permission ONLY when tapped) */}
                <button
                  type="button"
                  onClick={() => handleStartCamera('environment')}
                  className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/50 hover:bg-emerald-100/50 text-left transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 mb-3 group-hover:scale-105 transition">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                      Take Photo
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Open camera with viewfinder & preview
                    </p>
                  </div>
                </button>

                {/* 2. Upload Photo Button (Fallback) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-left transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                      Upload Photo
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select food picture from gallery or files
                    </p>
                  </div>
                </button>
              </div>

              {/* Hidden file input for standard photo upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Hidden file input with capture="environment" for native phone camera fallback */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleNativeCameraCapture}
                className="hidden"
              />

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Or test with sample foods
                </span>
              </div>

              {/* Sample Food Presets for Instant 1-Click Testing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Instant Demo Meals:
                  </span>
                  <span className="text-[11px] text-slate-400">Tap to load & preview</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_FOOD_OPTIONS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSampleSelected(sample)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-left flex items-center gap-2.5 transition group cursor-pointer"
                    >
                      <span className="text-2xl shrink-0 group-hover:scale-110 transition">{sample.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 text-xs truncate">
                          {sample.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {sample.cuisine} • {sample.tags.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accuracy & Permission notice */}
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-200/70">
                🔒 <span className="font-semibold text-slate-700">Privacy note:</span> Camera permission is requested only when you tap "Take Photo". You can review your photo with "Use This Photo" before any analysis begins.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
