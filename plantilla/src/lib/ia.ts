// HelmCode habla la API de OpenAI. Úsalo solo desde el servidor (rutas de
// src/app/api o Server Actions): en el navegador la clave no existe, y así debe ser.
export type Mensaje = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function completar(messages: Mensaje[]): Promise<string> {
  const { HELMCODE_API_KEY, HELMCODE_BASE_URL, HELMCODE_MODEL } = process.env;
  if (!HELMCODE_API_KEY || !HELMCODE_MODEL)
    throw new Error("Faltan HELMCODE_API_KEY o HELMCODE_MODEL en .env.local");
  const res = await fetch(
    `${HELMCODE_BASE_URL ?? "https://api.helmcode.com/v1"}/chat/completions`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${HELMCODE_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: HELMCODE_MODEL, messages }),
    },
  );
  if (!res.ok) throw new Error(`HelmCode respondió ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
