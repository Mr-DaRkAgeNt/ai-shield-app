import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// --- IMPORTANT: Firebase Configuration ---
// For the hackathon, we will paste the keys here directly to avoid build errors.
// Go to your Firebase project settings and copy/paste your keys to replace these placeholders.
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- Backend API URL ---
// This is the simplified URL for the unified deployment method.
const API_URL = '/api/immunize';

// --- SVG Icons ---
const ShieldCheckIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> </svg> );
const UploadCloudIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /> </svg> );
const GoogleIcon = () => ( <svg className="w-5 h-5 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262"> <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c22.69-21.033 35.88-53.37 35.88-91.864z"></path><path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.27 12.214-45.257 12.214-34.54 0-63.824-23.426-74.269-54.764l-1.732.13-40.09 31.024-2.315.198C31.386 230.658 77.225 261.1 130.55 261.1z"></path><path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.821-4.351-25.82 0-8.999 1.595-17.697 4.206-25.82l-2.032.189-41.336 32.06-2.953.238C1.986 150.623 0 165.223 0 180c0 14.777 1.986 29.377 5.484 42.651l44.335-34.335.034-.002z"></path><path fill="#EB4335" d="M130.55 50.479c19.231 0 36.344 6.578 50.074 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 77.225 0 31.386 30.442 5.484 73.065l46.332 35.842C61.727 76.843 86.01 50.479 130.55 50.479z"></path> </svg> );
const AlertTriangleIcon = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> </svg> );
const InfoIcon = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> );

// --- Main App & Components ---

export default function App() {
    const [page, setPage] = useState('landing');
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState(null); // New state for the message box

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
    };

    const closeMessage = () => {
        setMessage(null);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => { try { await signInWithPopup(auth, provider); } catch (error) { console.error("Error signing in", error); } };
    const handleLogout = async () => { try { await signOut(auth); } catch (error) { console.error("Error signing out", error); } };

    return (
        <main className="relative min-h-screen text-gray-800 font-sans bg-gray-50 overflow-x-hidden">
            <AnimatePresence>
                {message && <MessageBox message={message.text} type={message.type} onClose={closeMessage} />}
            </AnimatePresence>
            <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
            <AnimatePresence mode="wait">
                {page === 'landing' && <LandingPage key="landing" onStart={() => setPage('app')} onShowMessage={() => showMessage("Welcome to AI-Shield! This is an informational message.", "info")} />}
                {page === 'app' && <ImmunizerApp key="app" user={user} onLogin={handleLogin} />}
            </AnimatePresence>
        </main>
    );
}

// --- NEW MessageBox Component ---
const MessageBox = ({ message, type, onClose }) => {
    const icons = {
        info: <InfoIcon className="w-8 h-8 text-blue-500" />,
        success: <ShieldCheckIcon className="w-8 h-8 text-green-500" />,
        error: <AlertTriangleIcon className="w-8 h-8 text-red-500" />,
    };

    const colors = {
        info: 'border-blue-500',
        success: 'border-green-500',
        error: 'border-red-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md bg-white rounded-2xl shadow-xl border-t-4 ${colors[type]} p-6 text-center`}
            >
                <div className="mx-auto mb-4">{icons[type]}</div>
                <p className="text-gray-700 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-gray-800 text-white font-semibold py-2 px-8 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </motion.div>
    );
};


const Header = ({ user, onLogin, onLogout }) => (
    <header className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-7 w-7 text-teal-600" />
                <h1 className="text-xl font-bold tracking-tighter text-gray-900">AI-Shield</h1>
            </div>
            {user ? (
                <button onClick={onLogout} className="bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    Sign Out
                </button>
            ) : (
                <button onClick={onLogin} className="bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center text-sm">
                    <GoogleIcon /> Sign In
                </button>
            )}
        </div>
    </header>
);

const LandingPage = ({ onStart, onShowMessage }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen text-center"
    >
        <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-gray-900"
        >
            Your Image, Your Control.
        </motion.h1>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="max-w-2xl text-lg md:text-xl text-gray-600 mb-8"
        >
            AI-Shield adds an invisible, protective layer to your photos, making them unusable for deepfake creation and online harassment.
        </motion.p>
        <div className="flex items-center gap-4">
             <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
                onClick={onStart}
                className="px-8 py-4 bg-teal-600 text-white text-lg font-bold rounded-full hover:bg-teal-700 transition-colors shadow-lg"
            >
                Protect a Photo Now
            </motion.button>
             <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                onClick={onShowMessage}
                className="px-6 py-3 bg-gray-200 text-gray-700 text-base font-bold rounded-full hover:bg-gray-300 transition-colors"
            >
                How it Works
            </motion.button>
        </div>
    </motion.div>
);

const ImmunizerApp = ({ user, onLogin }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processedImageUrl, setProcessedImageUrl] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const { hasFreeUses, increment } = useAnonymousUsage();

    const handleFileChange = (selectedFile) => {
        if (!selectedFile) return;
        if (selectedFile.size > 10 * 1024 * 1024) { setError("File is too large (max 10MB)."); return; }
        if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) { setError("Invalid file type (JPG or PNG only)."); return; }
        setError('');
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setStatus('ready');
    };

    const handleProcess = async () => {
        const canProcess = user || hasFreeUses;
        if (!canProcess) { setStatus('limit_reached'); return; }
        if (!file) return;

        setStatus('processing');
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            if (!response.ok) { throw new Error( (await response.json()).error || 'Processing failed.'); }
            const data = await response.json();
            setAnalysisResult(data.analysis);
            setProcessedImageUrl(data.immunizedImage);
            setStatus('success');
            if (!user) increment();
        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
            setStatus('error');
        }
    };
    
    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setProcessedImageUrl(null);
        setAnalysisResult(null);
        setStatus('idle');
        setError('');
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 flex flex-col items-center min-h-screen">
            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200"
                >
                    {status === 'idle' && <UploadZone onFileChange={handleFileChange} error={error} />}
                    {status === 'ready' && <ReadyZone previewUrl={previewUrl} fileName={file?.name} onProcess={handleProcess} onReset={reset} />}
                    {status === 'processing' && <ProcessingZone />}
                    {status === 'success' && <SuccessZone imageUrl={processedImageUrl} analysisResult={analysisResult} onReset={reset} />}
                    {status === 'error' && <ErrorZone message={error} onReset={reset} />}
                    {status === 'limit_reached' && <LimitReachedZone onLogin={onLogin} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const UploadZone = ({ onFileChange, error }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const handleDrag = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(e.type === "dragenter" || e.type === "dragover"); }, []);
    const handleDrop = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.[0]) { onFileChange(e.dataTransfer.files[0]); } }, [onFileChange]);
    const handleChange = (e) => { if (e.target.files?.[0]) { onFileChange(e.target.files[0]); } };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-2">Protect Your Photo</h2>
            <p className="text-gray-600 text-center mb-6">Upload an image to add a protective layer.</p>
            <div
                className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrop} onClick={() => fileInputRef.current.click()}
            >
                <UploadCloudIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG or JPG (MAX 10MB)</p>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleChange} />
            </div>
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </div>
    );
};

const ReadyZone = ({ previewUrl, fileName, onProcess, onReset }) => (
    <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Armor</h2>
        <img src={previewUrl} alt="Preview" className="max-h-60 mx-auto rounded-lg mb-4 shadow-md"/>
        <p className="text-sm text-gray-600 mb-6 font-medium">{fileName}</p>
        <div className="flex justify-center gap-4">
            <button onClick={onReset} className="font-semibold py-2 px-6 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">Choose a different photo</button>
            <button onClick={onProcess} className="font-bold py-2 px-6 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors">Protect this Image</button>
        </div>
    </div>
);

const ProcessingZone = () => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
        <motion.div
            className="w-16 h-16"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        >
             <ShieldCheckIcon className="w-16 h-16 text-teal-500" />
        </motion.div>
        <p className="mt-4 text-lg font-semibold text-gray-800">Applying Protective Layer...</p>
        <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
);

const SuccessZone = ({ imageUrl, analysisResult, onReset }) => (
    <div>
        <div className="text-center mb-6">
            <ShieldCheckIcon className="w-12 h-12 text-teal-600 mx-auto mb-2" />
            <h2 className="text-3xl font-bold text-gray-900">Protection Complete!</h2>
            <p className="text-gray-600 mt-1">Your image is now armored and ready to share.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col items-center">
                <img src={imageUrl} alt="Processed" className="w-full max-w-sm mx-auto rounded-lg shadow-lg border border-gray-200" />
                <a href={imageUrl} download="armored-image.png" className="w-full max-w-sm mt-4 text-center px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors shadow-lg">
                    Download Protected Image
                </a>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold border-b border-gray-300 pb-2">AI Security Report</h3>
                <div className="flex items-start gap-3">
                    <InfoIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-gray-800">Image Summary</h4>
                        <p className="text-sm text-gray-600">{analysisResult.description}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-gray-800">Deepfake Risk</h4>
                        <p className="text-sm text-gray-600">{analysisResult.deepfakeRisk}</p>
                    </div>
                </div>
                {analysisResult.piiWarning && (
                     <div className="flex items-start gap-3 p-3 bg-orange-100 rounded-md border border-orange-200">
                        <AlertTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-orange-800">Privacy Warning</h4>
                            <p className="text-sm text-orange-700">{analysisResult.piiWarning}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <button onClick={onReset} className="w-full mt-6 text-center text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">
            Protect Another Image
        </button>
    </div>
);

const ErrorZone = ({ message, onReset }) => (
    <div className="text-center p-8">
        <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">An Error Occurred</h2>
        <p className="text-gray-600 bg-red-50 p-3 rounded-md mb-6">{message}</p>
        <button onClick={onReset} className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
            Try Again
        </button>
    </div>
);

const LimitReachedZone = ({ onLogin }) => (
    <div className="text-center p-8">
        <AlertTriangleIcon className="w-12 h-12 text-orange-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-orange-800 mb-2">Free Uses Reached</h2>
        <p className="text-gray-600 mb-6">Please sign in with your Google account for unlimited free protection.</p>
        <button onClick={onLogin} className="bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center mx-auto">
            <GoogleIcon /> Sign In to Continue
        </button>
    </div>
);

const useAnonymousUsage = () => {
    const [count, setCount] = useState(() => { try { return parseInt(localStorage.getItem('anonymousUsageCount') || '0', 10); } catch (e) { return 0; } });
    const maxFreeUses = 3;
    const hasFreeUses = count < maxFreeUses;
    const increment = () => { const newCount = count + 1; setCount(newCount); try { localStorage.setItem('anonymousUsageCount', newCount.toString()); } catch(e) { console.error("Could not write to local storage"); } };
    return { hasFreeUses, increment };
};

