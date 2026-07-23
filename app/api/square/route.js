import { supabase } from '../../../utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const customerId = body?.data?.object?.payment?.reference_id;

    if (!customerId) {
      return NextResponse.json({ error: "No reference ID attached" }, { status: 400 });
    }

    // Attempt to hit the database
    const { data, error } = await supabase
      .rpc('increment_stamp', { c_id: customerId });

    // IF DATABASE FAILS: Send the exact Supabase error to PowerShell
    if (error) {
      return NextResponse.json({ 
        error: "Supabase Error", 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Stamp added!", 
      currentStamps: data 
    }, { status: 200 });

  } catch (error) {
    // IF CODE CRASHES Send the exact code error to PowerShell
    return NextResponse.json({ 
      error: "Server Crash", 
      details: error.message 
    }, { status: 500 });
  }
}