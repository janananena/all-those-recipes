import { createContext, useState } from "react";
import {fetchAiConfig} from "../api/aiImageContentExt.ts";

export type AiContextType = {
    googleVisionApiKey: string;
    googlePalmApiKey: string;
    ingredientPrompt: string;
    stepsPrompt: string;
    reloadAiConfig: () => Promise<void>;
}

export const AiContext = createContext<AiContextType>({
    googleVisionApiKey: '',
    googlePalmApiKey: '',
    ingredientPrompt: '',
    stepsPrompt: '',
    reloadAiConfig: () => new Promise<void>(()=>{})
});

export const AiContextProvider = ({children}: {children: React.ReactNode}) => {
    const [googleVisionApiKey, setGoogleVisionApiKey] = useState('');
    const [googlePalmApiKey, setGooglePalmApiKey] = useState('');
    const [ingredientPrompt, setIngredientPrompt] = useState('');
    const [stepsPrompt, setStepsPrompt] = useState('');

    const reloadAiConfig = async () => {
        try {
            const config = await fetchAiConfig();
            setGoogleVisionApiKey(config.googleVisionApiKey);
            setGooglePalmApiKey(config.googlePalmApiKey);
            setIngredientPrompt(config.ingredientPrompt);
            setStepsPrompt(config.stepsPrompt);
        } catch (err) {
            console.error("Failed to reload ai config:", err);
        }
    };

    return (
        <AiContext.Provider value={{googleVisionApiKey, googlePalmApiKey, ingredientPrompt, stepsPrompt, reloadAiConfig}}>
            {children}
        </AiContext.Provider>
    );
}