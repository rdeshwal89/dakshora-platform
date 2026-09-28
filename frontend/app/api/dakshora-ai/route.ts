import { NextResponse } from "next/server";

function generateDakshoraFallbackAnswer(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("fee") || q.includes("payment") || q.includes("upi") || q.includes("ledger") || q.includes("receipt") || q.includes("leakage")) {
    return (
      "DAKSHORA Fees Management eliminates fee collection leakage with automated tuition demands, instant dynamic UPI QR codes, automated bank ledger reconciliations, and real-time digital receipts sent via SMS and WhatsApp. Accounts teams can track fee defaulters, configure installment plans and concessions, and export reports directly to Tally and Excel."
    );
  }

  if (q.includes("cbse") || q.includes("icse") || q.includes("exam") || q.includes("mark") || q.includes("report card") || q.includes("result")) {
    return (
      "DAKSHORA includes a 100% CBSE & ICSE compliant examination engine. It supports scholastic & co-scholastic grading, CCE frameworks, term-wise summative assessments, weightage calculations, and automated multi-color PDF report card generation with 1-click publishing to the Parent Portal."
    );
  }

  if (q.includes("attendance") || q.includes("roll call") || q.includes("biometric") || q.includes("register")) {
    return (
      "DAKSHORA Smart Attendance enables teachers to record complete classroom attendance in under 30 seconds from any mobile device or tablet. It also integrates seamlessly with RFID and biometric hardware, generates monthly percentage grids, and triggers automated low-attendance warnings to parents."
    );
  }

  if (q.includes("timetable") || q.includes("schedule") || q.includes("period") || q.includes("substitution")) {
    return (
      "DAKSHORA Timetable Management automatically generates collision-free weekly schedules, manages bell timings, and features intelligent teacher substitution recommendations whenever a faculty member is marked on leave."
    );
  }

  if (q.includes("parent") || q.includes("ward") || q.includes("student portal") || q.includes("homework") || q.includes("bus") || q.includes("gps")) {
    return (
      "The DAKSHORA Parent & Student Portal provides 24/7 mobile self-service access. Parents can monitor daily attendance, pay term fees via 1-click UPI, inspect exam report cards, view homework and circulars, and track the school bus live via real-time GPS."
    );
  }

  if (q.includes("price") || q.includes("pricing") || q.includes("cost") || q.includes("plan") || q.includes("fee structure") || q.includes("charge")) {
    return (
      "DAKSHORA offers transparent, predictable pricing for institutions of all sizes:\n\n• Foundation Starter: ₹15 / student / month (Core SIS, Attendance, Fees & Circulars)\n• Growth Academic OS: ₹28 / student / month (Full 13 ERP Modules, CBSE Report Cards, Bus GPS & Parent Portal - Most Popular)\n• Enterprise / Educational Trusts: Custom pricing for multi-campus chains with custom whitelabel domains and dedicated SLAs.\n\nBook a 1-on-1 demo or contact sales at +91 87963 47851 for a tailored quote."
    );
  }

  if (q.includes("website") || q.includes("real estate") || q.includes("msme") || q.includes("startup") || q.includes("coaching") || q.includes("college") || q.includes("custom") || q.includes("solution")) {
    return (
      "DAKSHORA engineers 8 specialized digital solutions:\n\n1. School Websites & Institutional ERP\n2. College & University Digital Ecosystems\n3. Coaching & EdTech Academy Platforms\n4. Business & MSME Digital Showcases\n5. Real Estate & Property Listing Portals\n6. Startup & High-Growth SaaS Platforms\n7. Professional & Practice Websites (Doctors, Lawyers, CA)\n8. Custom Enterprise Digital Solutions\n\nEach includes responsive design, CMS, lead capture CRM, and cloud scalability. Connect with us on WhatsApp (+91 87963 47851) to get started."
    );
  }

  if (q.includes("security") || q.includes("rbac") || q.includes("tenant") || q.includes("rls") || q.includes("privacy") || q.includes("data")) {
    return (
      "Security is foundational at DAKSHORA. We leverage Supabase PostgreSQL with enterprise Row Level Security (RLS) to enforce strict tenant isolation—School A can never see School B's data. Access is governed by granular Role-Based Access Control (RBAC) across 5 primary roles and teacher responsibility scopes."
    );
  }

  if (q.includes("demo") || q.includes("contact") || q.includes("call") || q.includes("whatsapp") || q.includes("email") || q.includes("support")) {
    return (
      "You can schedule a personalized 1-on-1 walkthrough of DAKSHORA 2.0 anytime!\n\n• WhatsApp: https://wa.me/918796347851 (+91 87963 47851)\n• Email: dakshora.ai@gmail.com\n• Demo Form: Fill out the schedule form on our homepage, and an onboarding advisor will reach out within 2 hours."
    );
  }

  return (
    "DAKSHORA 2.0 is India's premier Digital Operating System and AI Cloud for modern educational institutions and commercial enterprises. It combines 16 unified ERP modules (Attendance, Fees, Academics, Timetable, Exams, CBSE Report Cards, Transport GPS, Library, HR/Payroll), 8 custom website solutions, and native AI assistants. What specific feature or solution would you like to explore?"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    let messages = Array.isArray(body?.messages) ? body.messages : [];

    if (!messages.length && body?.message) {
      messages = [
        {
          role: "user",
          content: body.message,
        },
      ];
    }

    if (!messages.length) {
      return NextResponse.json(
        { error: "No conversation message received." },
        { status: 400 }
      );
    }

    const latestUserMessage = messages[messages.length - 1]?.content || "";
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      const fallbackAnswer = generateDakshoraFallbackAnswer(latestUserMessage);
      return NextResponse.json({
        success: true,
        answer: fallbackAnswer,
        language: "auto",
        source: "dakshora_engine",
      });
    }

    messages = messages.slice(-20);

    const systemMessage = {
      role: "system",
      content: `
You are DAKSHORA AI, an expert digital advisor for DAKSHORA 2.0 (School ERP, Academic Management, Custom Websites, and Multi-Tenant SaaS).
Provide helpful, concise, professional answers about DAKSHORA's 16 ERP modules, CBSE compliance, 8 digital solutions (Schools, Colleges, Coaching, MSMEs, Real Estate, Startups, Professionals, Enterprises), transparent pricing, and security.
When users ask about demos or contact, share WhatsApp +91 87963 47851 and dakshora.ai@gmail.com.
Support Hindi, English, and Hinglish naturally.
`,
    };

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://www.dakshora.co.in",
          "X-Title": "DAKSHORA AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [systemMessage, ...messages],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content;
        if (answer) {
          return NextResponse.json({
            success: true,
            answer,
            language: "auto",
            source: "openrouter",
          });
        }
      }
    } catch (fetchErr) {
      console.warn("OpenRouter API request failed, falling back to local engine:", fetchErr);
    }

    // Graceful fallback if OpenRouter failed
    const fallbackAnswer = generateDakshoraFallbackAnswer(latestUserMessage);
    return NextResponse.json({
      success: true,
      answer: fallbackAnswer,
      language: "auto",
      source: "dakshora_engine_fallback",
    });
  } catch (error) {
    console.error("DAKSHORA server error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "DAKSHORA AI server error.",
      },
      { status: 500 }
    );
  }
}
