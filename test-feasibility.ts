import { runFeasibilityAgent } from './agents/feasibility'

// Use real Genesis output from your earlier test
const mockResearch = {
    marketSummary: 'Async feedback tools market growing rapidly...',
    tam: { value: '$4.2B', source: 'Gartner 2025', methodology: 'Top-down' },
    sam: { value: '$800M', source: 'IDC' },
    som: { value: '$40M', rationale: '5% of SAM in 3 years' },
    painPoints: [{ description: 'Clients give feedback too late', source: 'Reddit', frequency: 'high' as const }],
    competitors: [{ name: 'Loom', positioning: 'Video messaging', weakness: 'Not purpose-built for feedback' }],
    competitorGap: 'No tool specifically for UX client feedback workflows',
    swot: { strengths: ['Clear niche'], weaknesses: ['Small team'], opportunities: ['Remote work trend'], threats: ['Loom could pivot'] },
    riskMatrix: Array.from({ length: 12 }, (_, i) => ({ risk: `Risk ${i + 1}: Market adoption concern`, likelihood: 'medium' as const, impact: 'high' as const, score: 6 })),
    topConcepts: [{ name: 'FeedFlow', description: 'Async UX feedback', opportunityScore: 9, rationale: 'Clear gap' }],
    recommendedConcept: 'FeedFlow'
}

runFeasibilityAgent(
    { ventureId: 'test-456', name: 'FeedFlow', context: { research: mockResearch } },
    async (chunk) => process.stdout.write(chunk),
    async (result) => {
        console.log('\n\n✓ Verdict:', result.verdict)
        console.log('Timing score:', result.marketTimingScore)
        console.log('Break-even month:', result.financialModel?.breakEvenMonth)
        console.log('Risk count:', result.risks?.length)
        console.log('LTV:CAC:', result.financialModel?.ltvCacRatio)
        console.log('Moat:', result.competitiveMoat?.slice(0, 100), '...')
    }
)
