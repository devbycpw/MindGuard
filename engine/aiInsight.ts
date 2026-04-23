// ============================================
// MindGuard AI — AI Insight Generator
// ============================================
import axios from 'axios';
import {
  CheckInEntry,
  AIInsight,
  RiskScore,
  PatternData,
} from '@/types/types';
import { generateId } from '@/utils/storage';

export async function generateOpenAIInsight(
  apiKey: string,
  checkIns: CheckInEntry[],
  riskScore: RiskScore | null,
  patterns: PatternData[]
): Promise<AIInsight> {
  if (!apiKey) {
    return generateRuleBasedInsight(checkIns, riskScore, patterns);
  }

  const prompt = buildPrompt(checkIns, riskScore, patterns);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah MindGuard AI, asisten kesehatan mental yang penuh empati.
Analisis data perilaku pengguna dan berikan insight yang personal dan actionable.
Gunakan bahasa Indonesia yang hangat dan suportif.
Format respons:
KONDISI: [deskripsi kondisi saat ini dalam 1-2 kalimat]
LEVEL: [Low/Medium/High]
INSIGHT: [analisis mendalam 2-3 kalimat]
SARAN:
- [saran 1]
- [saran 2]
- [saran 3]
PENTING: Kamu BUKAN terapis. Selalu sarankan bantuan profesional untuk kasus serius.`,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    return parseAIResponse(content, 'openai');
  } catch (error: any) {
    console.warn('OpenAI error, fallback to rule-based:', error?.message);
    return generateRuleBasedInsight(checkIns, riskScore, patterns);
  }
}

function parseAIResponse(content: string, source: 'openai' | 'rule_based'): AIInsight {
  const kondisiMatch = content.match(/KONDISI:\s*(.+?)(?:\n|LEVEL)/s);
  const levelMatch = content.match(/LEVEL:\s*(.+?)(?:\n|INSIGHT)/s);
  const insightMatch = content.match(/INSIGHT:\s*(.+?)(?:\n|SARAN)/s);
  const saranSection = content.match(/SARAN:\s*([\s\S]+)$/);

  const recommendations = saranSection
    ? saranSection[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
    : [];

  return {
    id: generateId(),
    timestamp: Date.now(),
    condition: kondisiMatch?.[1]?.trim() || 'Memproses data...',
    riskLevel: levelMatch?.[1]?.trim() || 'Medium',
    analysis: insightMatch?.[1]?.trim() || content,
    recommendations: recommendations.length > 0 ? recommendations : [content],
    confidence: 0.85,
    source,
  };
}

export function generateRuleBasedInsight(
  checkIns: CheckInEntry[],
  riskScore: RiskScore | null,
  patterns: PatternData[]
): AIInsight {
  if (checkIns.length === 0) {
    return {
      id: generateId(),
      timestamp: Date.now(),
      condition: 'Belum ada data. Lakukan check-in pertamamu!',
      riskLevel: '-',
      analysis: 'Mulai dengan mengisi daily check-in untuk mendapatkan insight personal tentang kesehatan mentalmu.',
      recommendations: [
        'Isi daily check-in pertamamu',
        'Coba isi setiap hari di waktu yang sama',
        'Jujurlah — tidak ada jawaban yang salah',
      ],
      confidence: 1,
      source: 'rule_based',
    };
  }

  const sorted = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);
  const recent = sorted.slice(0, 7);
  const avgMood = avg(recent.map(e => e.mood));
  const avgStress = avg(recent.map(e => e.stress));
  const avgSleep = avg(recent.map(e => e.sleepHours));

  // Determine condition
  let condition: string;
  let riskLevel: string;

  if (riskScore && riskScore.score >= 66) {
    condition = 'Kondisimu menunjukkan tingkat stress dan beban mental yang tinggi. Perlu perhatian segera.';
    riskLevel = 'High';
  } else if (riskScore && riskScore.score >= 36) {
    condition = 'Kondisimu cukup stabil, namun ada beberapa indikator yang perlu diperhatikan.';
    riskLevel = 'Medium';
  } else if (riskScore) {
    condition = 'Kondisi kesehatan mentalmu dalam keadaan baik. Pertahankan!';
    riskLevel = 'Low';
  } else {
    condition = 'Menganalisis data...';
    riskLevel = 'Medium';
  }

  // Build analysis
  const parts: string[] = [];
  const recommendations: string[] = [];

  if (avgMood <= 2) {
    parts.push(`Rata-rata mood ${avgMood.toFixed(1)}/5 menunjukkan kamu sedang dalam masa sulit.`);
    recommendations.push('Bicarakan perasaanmu dengan orang yang kamu percaya');
    recommendations.push('Lakukan aktivitas yang biasanya membuatmu senang');
  } else if (avgMood <= 3) {
    parts.push(`Mood rata-rata ${avgMood.toFixed(1)}/5 — masih ada ruang untuk improvement.`);
    recommendations.push('Identifikasi aktivitas yang meningkatkan mood-mu');
  } else {
    parts.push(`Mood rata-rata ${avgMood.toFixed(1)}/5 — bagus! Terus pertahankan.`);
  }

  if (avgStress >= 4) {
    parts.push(`Level stress tinggi (${avgStress.toFixed(1)}/5). Ini perlu diperhatikan.`);
    recommendations.push('Coba latihan pernapasan saat stress memuncak');
    recommendations.push('Kurangi beban aktivitas jika memungkinkan');
  } else if (avgStress >= 3) {
    parts.push(`Stress moderat (${avgStress.toFixed(1)}/5).`);
    recommendations.push('Jadwalkan istirahat rutin sepanjang hari');
  }

  if (avgSleep < 6) {
    parts.push(`Rata-rata tidur hanya ${avgSleep.toFixed(1)} jam — jauh di bawah rekomendasi 7-9 jam.`);
    recommendations.push('Usahakan tidur minimal 7 jam malam ini');
    recommendations.push('Buat rutinitas tidur yang konsisten');
  } else if (avgSleep < 7) {
    parts.push(`Tidur ${avgSleep.toFixed(1)} jam — sedikit di bawah optimal.`);
    recommendations.push('Coba tidur 30 menit lebih awal');
  }

  if (recommendations.length === 0) {
    recommendations.push('Pertahankan kebiasaan sehatmu');
    recommendations.push('Tetap konsisten dengan daily check-in');
    recommendations.push('Ingat untuk istirahat saat diperlukan');
  }

  return {
    id: generateId(),
    timestamp: Date.now(),
    condition,
    riskLevel,
    analysis: parts.join(' ') || 'Data masih terbatas. Terus lakukan check-in untuk insight yang lebih akurat.',
    recommendations: recommendations.slice(0, 5),
    confidence: 0.7,
    source: 'rule_based',
  };
}

function buildPrompt(checkIns: CheckInEntry[], riskScore: RiskScore | null, patterns: PatternData[]): string {
  const recent = [...checkIns].sort((a, b) => b.timestamp - a.timestamp).slice(0, 7);
  let prompt = `Data check-in kesehatan mental saya ${recent.length} hari terakhir:\n\n`;
  for (const e of recent) {
    prompt += `${e.date}: Mood ${e.mood}/5 | Tidur ${e.sleepHours}jam | Stress ${e.stress}/5`;
    if (e.notes) prompt += ` | Catatan: ${e.notes}`;
    prompt += '\n';
  }
  if (riskScore) {
    prompt += `\nRisk Score saat ini: ${riskScore.score}/100 (${riskScore.category})\n`;
  }
  if (patterns.length > 0) {
    prompt += `\nPola terdeteksi:\n`;
    for (const p of patterns) prompt += `- ${p.title}: ${p.description}\n`;
  }
  prompt += `\nBerikan analisis dan saran personal.`;
  return prompt;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
