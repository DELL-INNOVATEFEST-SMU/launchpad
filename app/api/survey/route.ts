import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface SurveyQuery {
  search?: string;
  phqBand?: string;
  dominantFlavor?: string;
  planetName?: string;
  nationality?: string;
  referral?: string;
  source?: string;
  date?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Server-side API route for fetching cosmic compass survey data
 * Uses service role key for database access - never exposed to client
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: SurveyQuery = {
      search: searchParams.get("search") || undefined,
      phqBand: searchParams.get("phqBand") || undefined,
      dominantFlavor: searchParams.get("dominantFlavor") || undefined,
      planetName: searchParams.get("planetName") || undefined,
      nationality: searchParams.get("nationality") || undefined,
      referral: searchParams.get("referral") || undefined,
      source: searchParams.get("source") || undefined,
      date: searchParams.get("date") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 10,
    };

    let supabaseQuery = supabaseAdmin
      .from("cosmic_compass_leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (query.search) {
      supabaseQuery = supabaseQuery.or(`email.ilike.%${query.search}%,phone.ilike.%${query.search}%`);
    }
    if (query.phqBand) {
      supabaseQuery = supabaseQuery.eq("phq_band", query.phqBand);
    }
    if (query.dominantFlavor) {
      supabaseQuery = supabaseQuery.eq("dominant_flavor", query.dominantFlavor);
    }
    if (query.planetName) {
      supabaseQuery = supabaseQuery.eq("planet_name", query.planetName);
    }
    if (query.nationality) {
      supabaseQuery = supabaseQuery.eq("nationality", query.nationality);
    }
    if (query.referral) {
      supabaseQuery = supabaseQuery.eq("referral", query.referral);
    }
    if (query.source) {
      supabaseQuery = supabaseQuery.eq("source", query.source);
    }
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.date);
      end.setHours(23, 59, 59, 999);

      supabaseQuery = supabaseQuery
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
    }

    // Apply pagination
    const from = (query.page! - 1) * query.pageSize!;
    const to = from + query.pageSize! - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data: rows, count, error } = await supabaseQuery;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch survey data" },
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
