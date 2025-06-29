import { genAI } from "../config/genAI";
import fs from "fs";

export const evaluateResponseAgainstCriteria = async (
    criteria: string,
    response: string,
    type: "text" | "image"
) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    let result;

    if (type === "text") {
        //Text response evaluation
        const prompt = `
              You are an evaluator.
        
              Criteria: "${criteria}"
              
              User's Text Response: "${response}"
              
              Does this response meet the criteria? Respond with ONLY a valid JSON like: {"isValid": true} or {"isValid": false}
            `
        ;

        result = await model.generateContent(prompt);

    } else if (type === "image") {
        // Image response evaluation
        const imageBase64 = fs.readFileSync(response, { encoding: "base64" });

        result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `You are an evaluator.

                                    Criteria: "${criteria}"
                                    
                                    Does this image meet the criteria? Respond with ONLY a valid JSON like: {"isValid": true} or {"isValid": false}`,
                        },
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

    const text = result.response.text();

    // Log the evaluation process
    console.log("----- Gemini Evaluation Log -----");
    console.log("📝 Criteria:", criteria);
    console.log("🧑‍💻 User Response:", type === "text" ? response : "(image file)");
    console.log("🤖 Gemini Raw Response:", text);

    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
        console.error("❌ No JSON found in Gemini response.");
        console.log("🔍 Evaluation Result: false");
        console.log("---------------------------------\n");
        return false;
    }

    try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.isValid === "boolean") {
            console.log("✅ Final Decision:", parsed.isValid);
            console.log("---------------------------------\n");
            return parsed.isValid;
        } else {
            throw new Error("Invalid JSON format from Gemini.");
        }
    } catch (e) {
        console.error("❌ Failed to parse Gemini JSON response:", e);
        console.log("🔍 Evaluation Result: false");
        console.log("---------------------------------\n");
        return false;
    }
};
