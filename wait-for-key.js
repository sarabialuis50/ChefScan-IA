const key = "AIzaSyASm18doUiNrNbsJHTxCd5UnEbL_SkHVMA";

async function testWithRetry() {
    console.log("Probando clave cada 30 segundos...\n");

    for (let i = 1; i <= 10; i++) {
        console.log(`Intento ${i}/10...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Test" }] }] })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("\n✅ ¡ÉXITO! La clave ya está activa y funcionando.");
                console.log("Respuesta:", data.candidates?.[0]?.content?.parts?.[0]?.text || "OK");
                process.exit(0);
            } else {
                console.log(`❌ Error ${response.status}: ${data.error?.message || JSON.stringify(data)}`);
            }
        } catch (e) {
            console.log(`❌ Exception: ${e.message}`);
        }

        if (i < 10) {
            console.log("Esperando 30 segundos...\n");
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    console.log("\n⚠️ La clave aún no está activa después de 5 minutos. Contacta a soporte de Google Cloud.");
}

testWithRetry();
