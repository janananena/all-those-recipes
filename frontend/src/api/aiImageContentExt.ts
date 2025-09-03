import axios from 'axios';
import type {IngredientGroup} from "../types/Recipe.ts";
import {type AiContextType} from "../context/AiContext.tsx";

const apiBaseUrl = `/api`;

export const fetchAiConfig = async (): Promise<AiContextType> => {
    const res = await axios.get<AiContextType>(`${apiBaseUrl}/ai-config.json`);
    return res.data;
}

async function readSrc(fileUrl: string, setLoading: (loading: boolean) => void): Promise<string> {
    setLoading(true);

    try {
        const res = await fetch(`${fileUrl}`);
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const res = reader.result?.toString().split(',')[1] ?? "";
                if (!res) {
                    console.error(`couldnt read image ${fileUrl}`);
                } else {
                    resolve(res);
                }
            };
            reader.onerror = () => {
                reject(new Error("Filereader failed."));
            };
            reader.readAsDataURL(blob);
        });

        return b64;
    } catch (err) {
        console.error("error reading file as base64: ", err);
        return "";
    } finally {
        setLoading(false);
    }
}

export async function readImgText(fileUrl: string, setLoading: (loading: boolean) => void, googleVisionKey: string): Promise<string> {

    let fulltext = "";
    const imageBase64 = await readSrc(fileUrl, setLoading);

    setLoading(true);
    try {
        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionKey}`,
            {
                requests: [
                    {
                        image: {content: imageBase64},
                        features: [{type: 'TEXT_DETECTION'}],
                    },
                ],
            },
            {
                headers: {
                    Authorization: '',
                }
            }
        );
        console.log('Vision API response:', JSON.stringify(response.data, null, 2));

        fulltext = response.data.responses[0].fullTextAnnotation?.text || '';
    } catch
        (error) {
        console.error('Detection of image text failed:', error);
    } finally {
        setLoading(false);
    }
    return fulltext;
}

export async function readIngredients(imageText: string, setLoading: (loading: boolean) => void, googlePalmKey: string, ingredientPrompt: string): Promise<IngredientGroup[]> {

    const prompt = `${ingredientPrompt}${imageText}`;

    setLoading(true);

    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": googlePalmKey,
        },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{text: prompt}]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 10000,
                topP: 0.8,
                topK: 40
            }
        })
    });

    const result = await response.json();

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    try {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']');
        const json = text.slice(jsonStart, jsonEnd + 1);
        const parse = JSON.parse(json);
        console.log(`parsed ingredients: ${parse}`);
        return [{group: 'extracted', items: parse}];
    } catch (err) {
        console.log("Failed to parse response text: ", text);
        console.error("Failed to parse ingredient JSON:", err);
        return [];
    } finally {
        setLoading(false);
    }
}

export async function readSteps(recipeName: string, imageText: string, setLoading: (loading: boolean) => void, googlePalmKey: string, stepsPrompt: string): Promise<string[]> {

    const prompt = `${stepsPrompt}\nRecipe name:${recipeName}\nText:${imageText}`;

    setLoading(true);

    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": googlePalmKey,
        },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{text: prompt}]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 10000,
                topP: 0.8,
                topK: 40
            }
        })
    });

    const result = await response.json();

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    try {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']');
        const json = text.slice(jsonStart, jsonEnd + 1);
        const parse = JSON.parse(json);
        console.log(`parsed steps: ${parse}`);
        return parse;
    } catch (err) {
        console.log("Failed to parse response text: ", text);
        console.error("Failed to parse steps JSON:", err);
        return [];
    } finally {
        setLoading(false);
    }
}