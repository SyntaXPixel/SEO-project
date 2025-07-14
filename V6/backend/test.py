import httpx
import asyncio

API_URL = "https://lexica.qewertyy.dev/models"
GPT_MODEL_ID = 5  # Updated to ID 5

SYSTEM_PROMPT = (
    "You are an advanced AI that receives a user input and rewrites it clearly, "
    "naturally, and fluently while preserving the original meaning. You must not shorten, "
    "summarize, analyze, or skip anything. Just rewrite the full input in better, more polished "
    "wording while keeping all the original details intact. Do not add or remove information. "
    "Output only the rewritten version of the user input, nothing else."
)

async def get_api_response(input_text: str):
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(API_URL, json={
            "model_id": GPT_MODEL_ID,
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": input_text
                }
            ]
        })

        if response.status_code == 200:
            data = response.json()
            return data.get("content", "No content received")
        else:
            return f"❌ Error {response.status_code}: {response.text}"

def main():
    input_text = input("🔤 Enter text to rewrite: ")
    rewritten = asyncio.run(get_api_response(input_text))
    print("\n✨ Rewritten Text:\n" + rewritten)

if __name__ == "__main__":
    main()