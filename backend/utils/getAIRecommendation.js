export async function getAIRecommendation(req, res, userPrompt, products) {
    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
    
    try {
        const geminiResponse = `
             Here is a list of avaiable products:
        ${JSON.stringify(products, null, 2)}

        Based on the following user request, filter and suggest the best matching products:
        "${userPrompt}"

        Only return the matching products in JSON format.    
        `

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "content": [{ parts : [{ text: geminiResponse }] }],
            })
        });

        const data = await response.json();
        const aiRecommendation = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No recommendation available';
        const createdText = aiRecommendation.replace(/```json|```/g, ``).trim(); 

        if (!createdText) {
            res.status(500).json({
                success: false,
                message: 'Failed to get AI recommendation OR AI did not return any recommendation'
            })
        }

        let parsedProducts;
        try {
            parsedProducts = JSON.parse(createdText);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to parse AI recommendation as JSON'
            })
        }

        return{
            success: true,
            data: parsedProducts
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to get AI recommendation OR Internal Server Error' });
    }
}
