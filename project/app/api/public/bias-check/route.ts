import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import { runComplianceCheck } from '@/lib/compliance';
import { createIPHash, createUAHash } from '@/lib/rateLimiter';

const biasCheckSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
  state: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, state } = biasCheckSchema.parse(body);

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const userAgent = request.headers.get('user-agent') || '';
    const ipHash = createIPHash(ip);
    const uaHash = createUAHash(userAgent);
    const requestId = crypto.randomUUID();

    // Log the submission
    await prisma.guestLog.create({
      data: {
        ip_hash: ipHash,
        ua_hash: uaHash,
        referer: request.headers.get('referer'),
        event: 'SUBMIT',
        request_id: requestId
      }
    });

    // Run compliance check
    const complianceResult = await runComplianceCheck(text, state);

    // Log compliance results
    await prisma.complianceLog.create({
      data: {
        target_type: 'FREE_CHECK',
        target_id: null,
        issues_found: complianceResult.issues,
        score: complianceResult.score,
        raw_text_snapshot: text.substring(0, 1000) // Store first 1000 chars for analytics
      }
    });

    return NextResponse.json({
      score: complianceResult.score,
      issues: complianceResult.issues,
      highlighted_text: complianceResult.highlighted_text,
      overall_assessment: complianceResult.overall_assessment,
      request_id: requestId
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Bias check error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}