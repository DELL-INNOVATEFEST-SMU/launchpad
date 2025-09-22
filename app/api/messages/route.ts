import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface MessagesQuery {
  search?: string;
  platform?: string;
  severity?: number;
  date?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Server-side API route for fetching messages data
 * Uses service role key for database access - never exposed to client
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: MessagesQuery = {
      search: searchParams.get("search") || undefined,
      platform: searchParams.get("platform") || undefined,
      severity: searchParams.get("severity") ? Number(searchParams.get("severity")) : undefined,
      date: searchParams.get("date") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 10,
    };

    let supabaseQuery = supabaseAdmin
      .from("messages")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false });

    // Apply filters
    if (query.search) {
      supabaseQuery = supabaseQuery.ilike("username", `%${query.search}%`);
    }
    if (query.platform) {
      supabaseQuery = supabaseQuery.eq("source", query.platform);
    }
    if (query.severity !== undefined) {
      supabaseQuery = supabaseQuery.eq("score", query.severity);
    }
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);

      supabaseQuery = supabaseQuery
        .gte("timestamp", start.toISOString())
        .lte("timestamp", end.toISOString());
    }

    // Apply pagination
    const from = (query.page! - 1) * query.pageSize!;
    const to = from + query.pageSize! - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: rows, count, error } = await supabaseQuery;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: rows || [],
      total: count || 0,
      page: query.page,
      pageSize: query.pageSize,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
