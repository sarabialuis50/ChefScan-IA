const key = "AIzaSyBqvcBxbnNOsLPRFhDIwduGeDwd0t_siUY";

async function test() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Test" }] }] })
        });
        const data = await response.json();
        if (response.ok) {
            console.log("✅ La clave VIEJA todavía funciona!");
        } else {
            console.log("❌ Error:", response.status, data.error?.message || JSON.stringify(data));
        }
    } catch (e) {
        console.log("❌ Exception:", e.message);
    }
}
test();
