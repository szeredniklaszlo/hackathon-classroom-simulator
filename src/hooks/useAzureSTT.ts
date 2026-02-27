import { useState, useEffect, useRef, useCallback } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface UseAzureSTTProps {
    language?: string;
}

export function useAzureSTT({ language = 'en-US' }: UseAzureSTTProps = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState(''); // Éppen felismert (interim) szöveg
    const [stableBuffer, setStableBuffer] = useState(''); // Véglegesített mondatok egyben
    const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);

    const startListening = useCallback(() => {
        const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
        const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            console.error('Azure Speech API kulcs vagy régió hiányzik az .env fájlból!');
            alert('Azure Speech API kulcs vagy régió hiányzik!');
            return;
        }

        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechRecognitionLanguage = language;

        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        recognizerRef.current = recognizer;

        // Folyamatos felismerés közben kapott eredmények ("recognizing")
        recognizer.recognizing = (s, e) => {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
            setTranscript(e.result.text);
        };

        // Amikor egy mondatot véglegesít az AI ("recognized")
        recognizer.recognized = (s, e) => {
            if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                console.log(`RECOGNIZED: Text=${e.result.text}`);
                setStableBuffer((prev) => prev ? prev + ' ' + e.result.text : e.result.text);
                setTranscript(''); // Az ideiglenes szöveg törlése, mert átkerült a véglegesbe
            } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                console.log('NOMATCH: Speech could not be recognized.');
            }
        };

        recognizer.canceled = (s, e) => {
            console.log(`CANCELED: Reason=${e.reason}`);
            if (e.reason === sdk.CancellationReason.Error) {
                console.log(`CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log('CANCELED: Did you update the subscription info?');
            }
            stopListening();
        };

        recognizer.sessionStopped = (s, e) => {
            console.log('\n    Session stopped event.');
            stopListening();
        };

        // Indítás
        recognizer.startContinuousRecognitionAsync(
            () => {
                console.log('Felismerés elindítva');
                setIsListening(true);
            },
            (err) => {
                console.error(err);
                setIsListening(false);
            }
        );
    }, [language]);

    const stopListening = useCallback(() => {
        if (recognizerRef.current) {
            recognizerRef.current.stopContinuousRecognitionAsync(
                () => {
                    console.log('Felismerés leállítva');
                    setIsListening(false);
                    recognizerRef.current?.close();
                    recognizerRef.current = null;
                },
                (err) => {
                    console.error(err);
                    setIsListening(false);
                }
            );
        } else {
            setIsListening(false);
        }
    }, []);

    // Cleanup unmount esetén
    useEffect(() => {
        return () => {
            if (recognizerRef.current) {
                recognizerRef.current.close();
                recognizerRef.current = null;
            }
        };
    }, []);

    const clearTranscript = useCallback(() => {
        setStableBuffer('');
        setTranscript('');
    }, []);

    const fullTranscript = stableBuffer + (transcript ? (stableBuffer ? ' ' : '') + transcript : '');

    return {
        isListening,
        startListening,
        stopListening,
        transcript,         // Az aktuális félkész szegmens
        stableBuffer,       // A feldolgozásra váró stabil szöveg
        setStableBuffer,    // Ezzel tudjuk "kivenni" az elejét, ha kész
        fullTranscript,     // Az összes szöveg egyben (UI megjelenítéshez)
        clearTranscript
    };
}
