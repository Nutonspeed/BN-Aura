import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale } = await params;
    const body = await request.json();
    const { image, clinicId, userId, tier, leadId } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Use Admin Client to bypass RLS for testing/mock purposes
    // In production, you might want to switch back to createClient() or add proper auth check
    const supabase = createAdminClient();

    // Map 'demo-clinic' to the actual UUID from our seed data
    const finalClinicId = clinicId === 'demo-clinic' ? '00000000-0000-0000-0000-000000000001' : clinicId;
    const finalUserId = userId === 'demo-user' ? null : userId;

    // 1. Upload image to Supabase Storage
    let buffer: Buffer;
    let contentType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const base64Data = image.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
      const match = image.match(/^data:(image\/\w+);base64,/);
      if (match) contentType = match[1];
    } else if (image.startsWith('http')) {
      // For mock testing: fetch external image
      const imgRes = await fetch(image);
      const arrayBuffer = await imgRes.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    } else {
      throw new Error('Invalid image format');
    }

    const folder = userId || 'guest';
    const fileName = `${folder}/${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('analysis-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('analysis-images')
      .getPublicUrl(fileName);

    // 2. Prepare Prompt for Gemini 2.5 Pro (Sales-Driven & Urgent)
    const prompt = `คุณคือ "Aesthetic Intelligence Expert" ระดับ Hi-end หน้าที่ของคุณคือวิเคราะห์ภาพผิวพรรณเพื่อสนับสนุนการขายในคลินิกความงาม
    ใช้ผลการวิเคราะห์เพื่อช่วยให้ทีมขาย (Sales Staff) ปิดการขายได้ง่ายขึ้น โดยเน้นไปที่:
    1. "Urgency": ระบุว่าปัญหาผิวใดที่หากไม่รีบรักษาจะแย่ลงอย่างรวดเร็ว
    2. "Aesthetic Roadmap": วางแผนความสวยเป็นขั้นตอนที่เข้าใจง่าย ทั้งหัตถการและสกินแคร์
    3. "Lead Hotness": ประเมินความต้องการจริงของลูกค้า (0-100)

    ให้ผลการวิเคราะห์ในรูปแบบ JSON เท่านั้น โดยห้ามมีคำนำหน้าหรือสรุปอื่นๆ:
    {
      "skinAge": number,
      "skinType": "Oily" | "Dry" | "Combination" | "Normal" | "Sensitive",
      "overallScore": number (0-100),
      "grade": "A+" | "A" | "B" | "C",
      "leadHotnessScore": number (0-100),
      "urgencyLevel": "High" | "Medium" | "Low",
      "salesHook": "string (ประโยคสั้นๆ ที่เซลล์ควรใช้พูดเพื่อปิดการขาย)",
      "scores": {
        "spots": number, "wrinkles": number, "texture": number, "pores": number
      },
      "concerns": [
        {
          "name": "string", 
          "severity": number (1-10), 
          "description": "string",
          "whyItMattersNow": "string"
        }
      ],
      "recommendations": {
        "treatments": [
          {
            "program": "string",
            "standardCategory": "laser" | "injectable" | "device" | "facial",
            "sessions": number,
            "whyThis": "string"
          }
        ],
        "products": [
          {
            "name": "string",
            "standardCategory": "cleanser" | "serum" | "moisturizer" | "sunscreen",
            "keyIngredients": "string",
            "usage": "string"
          }
        ]
      }
    }`;

    // 3. Call AI Gateway + Gemini 2.5 Pro
    let parsedResult;
    
    // Check if we should use mock AI for testing
    if (process.env.MOCK_AI === 'true' || clinicId === 'demo-clinic' || finalClinicId === '00000000-0000-0000-0000-000000000001') {
      parsedResult = {
        skinAge: 28,
        skinType: "Combination",
        overallScore: 85,
        grade: "A",
        leadHotnessScore: 92,
        urgencyLevel: "High",
        salesHook: "ผิวของคุณพื้นฐานดีมากครับ แต่เริ่มมีริ้วรอยจางๆ ที่หางตา ถ้าเริ่มทำโปรแกรมยกกระชับตอนนี้จะรักษาความอ่อนเยาว์ได้นานขึ้นครับ",
        scores: { spots: 90, wrinkles: 75, texture: 82, pores: 88 },
        concerns: [
          {
            name: "ริ้วรอยรอบดวงตา (Crow's Feet)",
            severity: 4,
            description: "เริ่มเห็นริ้วรอยเล็กๆ เมื่อยิ้ม สาเหตุจากการแสดงสีหน้าและการสูญเสียคอลลาเจน",
            whyItMattersNow: "หากปล่อยไว้ริ้วรอยจะลึกขึ้นและแก้ไขได้ยากขึ้นในอนาคต"
          }
        ],
        recommendations: {
          treatments: [
            {
              program: "BN-Aura Glow Ultra Lift",
              standardCategory: "laser",
              sessions: 3,
              whyThis: "เพื่อกระตุ้นคอลลาเจนและยกกระชับริ้วรอยส่วนเกิน"
            }
          ],
          products: [
            {
              name: "Advanced Retinol Night Serum",
              standardCategory: "serum",
              keyIngredients: "Retinol 0.5%, Hyaluronic Acid",
              usage: "ทาบางๆ ทั่วใบหน้าก่อนนอน"
            }
          ]
        }
      };
    } else {
      const aiResultText = await callGemini(prompt, 'gemini-2.5-pro', {
        clinicId: finalClinicId,
        userId,
        tier: tier || 'professional',
        useCache: true
      });

      try {
        const jsonContent = aiResultText.replace(/```json|```/g, '').trim();
        parsedResult = JSON.parse(jsonContent);
      } catch {
        console.error('Failed to parse Gemini response:', aiResultText);
        throw new Error('AI response was not valid JSON');
      }
    }

    // --- SMART CLINIC MAPPING LOGIC (V2: Split Treatments & Products) ---
    const recommendations = parsedResult.recommendations;
    
    // 1. Map Treatments
    if (recommendations.treatments && recommendations.treatments.length > 0) {
      const tCategories = [...new Set(recommendations.treatments.map((r: { standardCategory: string }) => r.standardCategory))];
      const { data: realTreatments } = await supabase
        .from('treatments')
        .select('*')
        .eq('clinic_id', finalClinicId)
        .in('category', tCategories)
        .eq('is_active', true);

      if (realTreatments && realTreatments.length > 0) {
        recommendations.treatments = recommendations.treatments.map((rec: { standardCategory: string; program: string; price: number; treatmentId?: string }) => {
          const match = realTreatments.find(t => t.category === rec.standardCategory);
          if (match) {
            return {
              ...rec,
              program: match.names[locale] || match.names['en'] || rec.program,
              price: match.price_min,
              treatmentId: match.id,
              image_url: match.image_url
            };
          }
          return rec;
        });
      }
    }

    // 2. Map Products
    if (recommendations.products && recommendations.products.length > 0) {
      const pCategories = [...new Set(recommendations.products.map((r: { standardCategory: string }) => r.standardCategory))];
      const { data: realProducts } = await supabase
        .from('inventory_products')
        .select('*')
        .eq('clinic_id', finalClinicId)
        .in('category', pCategories);

      if (realProducts && realProducts.length > 0) {
        recommendations.products = recommendations.products.map((rec: { standardCategory: string; name: string; price: number; productId?: string; image_url?: string }) => {
          const match = realProducts.find(p => p.category === rec.standardCategory);
          if (match) {
            return {
              ...rec,
              name: match.name,
              price: match.sale_price,
              productId: match.id,
              image_url: match.image_url
            };
          }
          return rec;
        });
      }
    }

    // 4. Save to Supabase (Analysis)
    const { data: savedAnalysis, error: dbError } = await supabase
      .from('skin_analyses')
      .insert({
        user_id: finalUserId,
        clinic_id: finalClinicId,
        image_url: publicUrl,
        overall_score: parsedResult.overallScore,
        skin_health_grade: parsedResult.grade,
        skin_age: parsedResult.skinAge,
        skin_type: parsedResult.skinType,
        spots_score: parsedResult.scores?.spots,
        wrinkles_score: parsedResult.scores?.wrinkles,
        texture_score: parsedResult.scores?.texture,
        pores_score: parsedResult.scores?.pores,
        spots_detections: parsedResult.concerns,
        recommendations: parsedResult.recommendations
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 5. Update Lead Score if Lead ID provided
    if (leadId && leadId !== 'null') {
      // Calculate final score: AI Hotness (60%) + Base Points for finishing scan (40 pts)
      const basePoints = 40;
      const aiContribution = (parsedResult.leadHotnessScore || 0) * 0.6;
      const finalLeadScore = Math.min(100, Math.round(basePoints + aiContribution));

      await supabase
        .from('sales_leads')
        .update({ 
          score: finalLeadScore,
          primary_concern: parsedResult.concerns?.[0]?.name || 'Skin Revitalization',
          status: 'qualified', 
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }

    return NextResponse.json({ 
      id: savedAnalysis.id,
      ...parsedResult 
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('AI Analysis API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
