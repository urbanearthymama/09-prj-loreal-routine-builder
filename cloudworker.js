// cloudworker.js
// This file provides a function to call the Cloudflare Worker endpoint securely for OpenAI API requests.
// Students: You do NOT need to expose your OpenAI API key in the browser!

/**
 * Sends a message array to the Cloudflare Worker, which will handle the OpenAI API call securely.
 * @param {Array} messages - The conversation history for the OpenAI API (see OpenAI docs for format)
 * @returns {Promise<string>} - The assistant's reply from OpenAI
 */
async function fetchOpenAIResponse(messages) {
  // The endpoint for the Cloudflare Worker
  const endpoint = "https://cloudflareworker.panels10.workers.dev/";

  // Prepare the request body
  const body = JSON.stringify({
    messages: messages,
    model: "gpt-4o", // Use gpt-4o as default
  });

  // Make the POST request to the worker
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  // Parse the response
  const data = await response.json();

  // Return the assistant's reply (beginner-friendly: check for content)
  if (
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
  ) {
    return data.choices[0].message.content;
  } else {
    throw new Error("No response from OpenAI API");
  }
}

// Example usage (uncomment to test):
// fetchOpenAIResponse([{role: "user", content: "Hello!"}]).then(console.log);

// This file acts as a proxy to the OpenAI API, forwarding requests from the browser.
// It now supports the 'tools' parameter for web search with gpt-4o.

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Parse the incoming request body
  const body = await request.json();

  // Forward the request to OpenAI API with web search tool enabled
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // You must set your OpenAI API key in secrets.js or as an environment variable
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model || "gpt-4o",
      messages: body.messages,
      tools: body.tools || [{ type: "web_search" }],
    }),
  });

  // Return the OpenAI response directly to the browser
  return new Response(openaiRes.body, {
    status: openaiRes.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
