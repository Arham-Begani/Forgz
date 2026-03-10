import { GoogleGenerativeAI } from '@google/generative-ai'

const g = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function test(name: string) {
    try {
        const m = g.getGenerativeModel({ model: name })
        const r = await m.generateContent('say hi in 3 words')
        console.log(`✅ ${name}: ${r.response.text().trim().slice(0, 40)}`)
    } catch (e: any) {
        console.log(`❌ ${name}: ${e.status} ${e.statusText || e.message}`)
    }
}

async function main() {
    await test('gemini-3-flash-preview')
    await test('gemini-3-pro')
    await test('gemini-2.5-flash')
    await test('gemini-2.5-pro')
    await test('gemini-2.0-flash')
}

main()
