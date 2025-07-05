import { genAI } from "../config/genAI";
import fs from "fs";

/**
 * Generates an evaluation prompt based on criteria and type.
 */
const getPrompt = (criteria: string, response: string, type: "text" | "image") => {
    if (type === "text") {
        return `
                You are an intelligent evaluator.
                
                Your task is to verify if a user's text response satisfies a given criteria.
                
                Criteria:
                "${criteria}"
                
                User's Text Response:
                "${response}"
                
                Instructions:
                - The response should be considered valid if it partially or fully satisfies the criteria.
                - Minor spelling mistakes, typographical errors, or grammar issues should be ignored if the intended meaning is clear.
                - Synonyms or close alternatives to keywords in the criteria are acceptable except for people name.
                - ignore the case of the letters.
                - Do not be overly strict — if it's reasonably evident that the user meant the correct thing, accept it.
                
                Respond with ONLY one of the following valid JSON formats:
                {"isValid": true}
                {"isValid": false}
                `;
    }

    if (type === "image") {
        return `
                You are an intelligent image evaluator.
                
                Your task is to verify whether an image satisfies a given criteria.
                
                Criteria:
                "${criteria}"
                
                Instructions:
                - If the criteria involves identifying people, it is acceptable even if the image shows only their face(s) — the full body is NOT required.
                - Accept images that partially fulfill the criteria if the intention is clear.
                - Be forgiving with image composition — clarity and relevance matter more than completeness.
                - Do not be overly strict; if the image contextually matches or sufficiently relates to the criteria, consider it valid.
                
                Respond with ONLY one of the following valid JSON formats:
                {"isValid": true}
                {"isValid": false}
                `;
    }

    throw new Error("Invalid response type.");
};

/**
 * Evaluates a response (text or image) against a criteria using Gemini.
 */
export const evaluateResponseAgainstCriteria = async (
    criteria: string,
    response: string,
    type: "text" | "image"
) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let result;

    try {
        if (type === "text") {
            const prompt = getPrompt(criteria, response, "text");

            result = await model.generateContent(prompt);
        } else if (type === "image") {
            const prompt = getPrompt(criteria, response, "image");
            const imageBase64 = fs.readFileSync(response, { encoding: "base64" });

            result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: imageBase64,
                                },
                            },
                        ],
                    },
                ],
            });
        } else {
            throw new Error("Invalid response type.");
        }

        const textResponse = result.response.text();

        // Log evaluation process
        console.log("----- Gemini Evaluation Log -----");
        console.log("📝 Criteria:", criteria);
        console.log("🧑‍💻 User Response:", type === "text" ? response : "(image file)");
        console.log("🤖 Gemini Raw Response:", textResponse);

        const jsonMatch = textResponse.match(/\{[^}]+\}/);
        if (!jsonMatch) {
            console.error("❌ No JSON found in Gemini response.");
            console.log("🔍 Evaluation Result: false");
            console.log("---------------------------------\n");
            return false;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (typeof parsed.isValid === "boolean") {
            console.log("✅ Final Decision:", parsed.isValid);
            console.log("---------------------------------\n");
            return parsed.isValid;
        } else {
            throw new Error("Invalid JSON format from Gemini.");
        }
    } catch (e) {
        console.error("❌ Error during evaluation:", e);
        console.log("🔍 Evaluation Result: false");
        console.log("---------------------------------\n");
        return false;
    }
};
