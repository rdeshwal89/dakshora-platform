export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    const apiKey =
      process.env.OPENROUTER_API_KEY;


    if (!apiKey) {

      return res.status(500).json({
        error:
          "DAKSHORA AI is not configured."
      });

    }


    const body =
      req.body || {};


    /*
      Support both:
      messages: [...]
      and old:
      message: "..."
    */

    let messages =
      Array.isArray(body.messages)
        ? body.messages
        : [];


    if (
      !messages.length &&
      body.message
    ) {

      messages = [
        {
          role: "user",
          content: body.message
        }
      ];

    }


    if (!messages.length) {

      return res.status(400).json({
        error:
          "No conversation message received."
      });

    }


    /*
      Protect server from
      excessively large conversations.

      Keep latest 20 messages.
    */

    messages =
      messages.slice(-20);


    const systemMessage = {

      role: "system",

      content: `
You are DAKSHORA AI.

DAKSHORA is an India-first, inclusive AI assistant.

You help:

• Children
• Students
• Parents
• Teachers
• Professionals
• Job seekers
• Entrepreneurs
• Small businesses
• Senior citizens

Your goal is not just to answer questions.

Your goal is:

Problem
↓
Understand
↓
Clarify
↓
Plan
↓
Action
↓
Progress

LANGUAGE:

Understand the user's language automatically.

Reply in the user's language whenever possible.

Support:

Hindi
English
Hinglish
Punjabi
Bengali
Marathi
Gujarati
Tamil
Telugu
Kannada
Malayalam
and other languages when possible.

If the user mixes languages,
reply naturally using the same style.

IMPORTANT:

Remember the conversation context.

If the user says:

"I have ₹50,000."

and later asks:

"What should I do?"

understand that the question refers
to the previous information.

Do NOT ask the user to repeat information
that is already available in the conversation.

STYLE:

Be friendly.
Be respectful.
Be simple.
Be practical.

Avoid unnecessary technical jargon.

If a problem is unclear,
ask only the minimum useful questions.

Do not overwhelm users.

For children:
Use age-appropriate, safe explanations.

For senior citizens:
Use simple, clear language.

For career/business/earning questions:
Give realistic guidance.

Never guarantee:

• Jobs
• Income
• Business success
• Investment returns

For medical, legal or financial matters,
provide general information and recommend
qualified professional help when appropriate.

Never pretend to be human.

You are DAKSHORA AI.

Your response should feel like a helpful
conversation, not a search result.
`
    };


    /*
      Call OpenRouter
    */

    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`,

            "HTTP-Referer":
              "https://www.dakshora.in",

            "X-Title":
              "DAKSHORA AI"

          },

          body: JSON.stringify({

            model:
              "openrouter/free",

            messages: [
              systemMessage,
              ...messages
            ],

            temperature: 0.7,

            max_tokens: 1200

          })

        }
      );


    const data =
      await response.json();


    /*
      Handle OpenRouter errors
    */

    if (!response.ok) {

      console.error(
        "OpenRouter Error:",
        data
      );


      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "OpenRouter request failed."

      });

    }


    /*
      Extract answer
    */

    const answer =
      data
        ?.choices?.[0]
        ?.message?.content;


    if (!answer) {

      return res.status(500).json({

        error:
          "DAKSHORA received an empty AI response."

      });

    }


    /*
      Return response
    */

    return res.status(200).json({

      success: true,

      answer: answer,

      language: "auto"

    });


  } catch (error) {

    console.error(
      "DAKSHORA server error:",
      error
    );


    return res.status(500).json({

      error:
        error?.message ||
        "DAKSHORA AI server error."

    });

  }

}
