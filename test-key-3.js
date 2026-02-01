const key = "AIzaSyD0ZrqH50bdx6htDB1g4TExXUF-DeDnXrg";

async function test() {
    console.log("Probando ChefCam API Key 3...\n");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hola Chef" }] }] })
        });
        const data = await response.json();
        if (response.ok) {
            console.log("✅ ¡ÉXITO! La clave funciona perfectamente!");
            console.log("Respuesta del Chef:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            console.log("❌ Error:", response.status, data.error?.message || JSON.stringify(data));
        }
    } catch (e) {
        console.log("❌ Exception:", e.message);
    }
}
test();
