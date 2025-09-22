import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface SurveyQuery {
  search?: string;
  phqBand?: string;
  planetName?: string;
  nationality?: string;
  source?: string;
  dateBefore?: string;
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
      planetName: searchParams.get("planetName") || undefined,
      nationality: searchParams.get("nationality") || undefined,
      source: searchParams.get("source") || undefined,
      dateBefore: searchParams.get("dateBefore") || undefined,
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
    if (query.planetName) {
      supabaseQuery = supabaseQuery.eq("planet_name", query.planetName);
    }
    if (query.nationality) {
      if (query.nationality === "SG") {
        supabaseQuery = supabaseQuery.eq("nationality", "SG");
      } else if (query.nationality === "Others") {
        supabaseQuery = supabaseQuery.neq("nationality", "SG");
      }
    }
    if (query.source) {
      supabaseQuery = supabaseQuery.eq("source", query.source);
    }
    if (query.dateBefore) {
      const beforeDate = new Date(query.dateBefore);
      beforeDate.setHours(23, 59, 59, 999);
      supabaseQuery = supabaseQuery.lte("created_at", beforeDate.toISOString());
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
