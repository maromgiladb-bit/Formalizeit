import { readFileSync } from 'node:fs';
const env = readFileSync('.env.local','utf8');
for (const line of env.split(/\r?\n/)) { const m=line.match(/^([A-Z0-9_]+)=(.*)$/); if(m) process.env[m[1]]=m[2].replace(/^["']|["']$/g,''); }
const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
const { streamText, stepCountIs, tool } = await import('ai');
const { z } = await import('zod');
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const tools = {
  getDurationInYears: tool({ description:'months to years', inputSchema:z.object({months:z.number()}), execute:async({months})=>({years:months/12,exceedsFiveYears:months>60}) }),
  recordFindings: tool({ description:'record findings', inputSchema:z.object({findings:z.array(z.object({severity:z.enum(['high','medium','low']),category:z.string(),field:z.string(),fieldLabel:z.string(),message:z.string()}))}), execute:async({findings})=>({recorded:true,count:findings.length}) }),
};
const t0 = Date.now();
console.log('starting streamText (gemini-3-flash-preview)...');
try {
  const result = streamText({
    model: google('gemini-3-flash-preview'),
    system: 'You are Formi, an NDA reviewer. Draft: term_months=24, additional_terms="(empty)". Give a brief English analysis and you MUST call recordFindings once.',
    messages: [{ role:'user', content:'Review my NDA draft now in English.' }],
    tools, stopWhen: stepCountIs(5),
  });
  let chars = 0, firstChunkMs = null;
  for await (const delta of result.textStream) {
    if (firstChunkMs===null){ firstChunkMs = Date.now()-t0; console.log(`first text chunk at ${firstChunkMs}ms`); }
    chars += delta.length;
  }
  const steps = await result.steps;
  const calls = steps.flatMap(s=>s.toolCalls??[]);
  console.log(`DONE in ${Date.now()-t0}ms | textChars=${chars} | steps=${steps.length} | tools=[${calls.map(c=>c.toolName).join(',')}]`);
  console.log('finishReason:', await result.finishReason);
} catch(e){ console.log(`ERROR after ${Date.now()-t0}ms:`, (e?.message||String(e)).split('\n').slice(0,3).join(' | ')); }
