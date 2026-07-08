import { ai } from "../services/gemini";

export const nexusAiChat = async (req: any, res: any) => {
  try {
    const { prompt, history, catalogue, language } = req.body;
    
    const langInstructions = language === 'en' ? 'RESPOND ALWAYS IN ENGLISH.' : language === 'pt' ? 'RESPOND ALWAYS IN PORTUGUESE.' : 'RESPONDE SIEMPRE EN ESPAÑOL.';
    
    const systemInstruction = `Eres Nexus AI, el asistente experto de la tienda de aplicaciones "NexusPlay".

REGLAS ESTRICTAS:
1. ${langInstructions}
2. Responde SIEMPRE con un tono natural, directo y servicial usando Markdown.
3. Si el usuario hace preguntas generales (ej: "cómo optimizar Android", "cómo liberar espacio"), responde ÚNICAMENTE la consulta de manera clara y profesional. NO recomiendes aplicaciones si no las piden expresamente o si no son clave para resolver el problema.
4. NO generes tablas mal formateadas o contenido roto. Usa viñetas o texto estructurado.
5. NUNCA recomiendes aplicaciones que no estén en tu catálogo. No inventes aplicaciones.
6. NO menciones juegos o apps (ej: "Minecraft") si no están en el contexto o catálogo.

MANEJO DE APPS Y JSON FINAL:
Si decides que es necesario recomendar aplicaciones (porque el usuario lo pidió o porque encajan perfectamente con el pedido), debes seleccionar sus IDs exactos del catálogo.
AL FINAL de tu respuesta, DEBES incluir EXCLUSIVAMENTE un bloque JSON protegido con \`\`\`json que contenga un arreglo de strings con los IDs. 

Ejemplo si no recomiendas nada (PREDETERMINADO PARA PREGUNTAS GENERALES):
\`\`\`json
[]
\`\`\`

Ejemplo si recomiendas aplicaciones del catálogo:
\`\`\`json
["id-app-1", "id-app-2"]
\`\`\`

Catálogo disponible:
${JSON.stringify(catalogue, null, 2)}`;

    const contents = (history || []).map((h: any) => ({
      role: h.role, // 'user' or 'model'
      parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`[Nexus AI] Enviando mensaje a Gemini (prompt: ${prompt.substring(0, 50)}...)`);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7
          }
        });
        console.log(`[Nexus AI] Respuesta de Gemini OK`);
        break; // Success, exit retry loop
      } catch (err: any) {
        if (retries === 1 || (err?.status !== 'UNAVAILABLE' && err?.status !== 'RESOURCE_EXHAUSTED' && err?.status !== 503 && err?.status !== 429)) {
          throw err;
        }
        console.warn(`[Nexus AI] Gemini API falló (${err?.status}). Reintentando (${3 - retries + 1}/3)... wait 1000ms`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }
    
    res.json({ success: true, text: response?.text });
  } catch (error: any) {
    console.error("[Nexus AI Error]", error);
    
    // Devolvemos el error detallado
    res.status(500).json({ 
      success: false,
      error: error.message || "Error al procesar la recomendación de IA",
      details: {
        code: error?.status || error?.code || 500,
        status: error?.statusText || "ERROR",
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      }
    });
  }
};

export const nexus3dAi = async (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    const systemInstruction = `Eres una IA experta en diseño de niveles 3D para una plataforma "Nexus Studio" (estilo voxel/Three.js).
Genera SIEMPRE un entorno COMPLETO y RICO con MÚLTIPLES objetos (AL MENOS 10 A 30 OBJETOS) distribuidos en la escena. Nunca generes un solo objeto, debes construir la escena entera (ciudades completas con edificios y calles, bosques densos, etc).
Genera un array de objetos JSON para construir el escenario. Cada objeto debe tener:
- id (string único)
- type ("wall", "prop", "nature", "enemy", "vehicle")
- shape ("cube", "sphere", "cylinder") si es wall
- prop_type ("ruined_building", "car_abandoned", "skyscraper", "street_light", "cactus", "snow_pine") si es prop
- nature_type ("tree", "rock", "bush", "mountain", "animal", "crate") si es nature
- position ([x, y, z]) (Distribuye los objetos, no pongas todo en 0,0,0)
- scale ([x, y, z])
- rotation ([x, y, z])
- color (código hex)
- label (nombre descriptivo)
Solo debes devolver un arreglo JSON válido envuelto en \`\`\`json y \`\`\`.`;

    const modelName = "gemini-2.5-flash";
    console.log("Modelo Gemini:", modelName);

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { systemInstruction: systemInstruction, temperature: 0.8 }
        });
        break;
      } catch (err: any) {
        if (retries === 1 || (err?.status !== 'UNAVAILABLE' && err?.status !== 'RESOURCE_EXHAUSTED' && err?.status !== 503 && err?.status !== 429)) {
          throw err;
        }
        console.warn(`[Sandbox AI] Gemimi API retry (${3 - retries + 1}/3)... waiting 1000ms`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }
    
    console.log("Respuesta Gemini OK");
    res.json({ success: true, text: response?.text });
  } catch (error: any) {
    console.error("Error Gemini:", error);
    res.status(500).json({ success: false, error: "Modelo Gemini no disponible" });
  }
};
