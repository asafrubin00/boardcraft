# BoardCraft

**A corporate governance strategy game. Playable in your browser.**

🎮 [Play now →](https://boardcraft-eight.vercel.app)

BoardCraft makes you the Board Adviser: an outsider retained for a year to rebuild a board and steer it through the full cycle of corporate governance - from assembling a compliant board to surviving shareholder season. Beyond a simple training tool BoardCraft is a game that just so happens to be deeply accurate.

---

## The Premise

You inherit a company with a fractured board, a sceptical proxy adviser, and an AGM on the horizon. Every decision - who you appoint, which crises you escalate, how you spend your governance capital - has consequences. Get it right and you build a board that can weather anything. Get it wrong and the institutional shareholders will let you know.

---

## What's in the Game

**Five playable companies**, each with distinct governance challenges and regulatory contexts:
- **Harwick Energy PLC** - UK-listed, UK Corporate Governance Code, ESG scrutiny, activist pressure
- **Vantage Consumer Brands Inc** - NYSE-listed, US proxy rules, combined Chair/CEO, compensation controversy
- **Rheinfeld AG** - German two-tier board, co-determination, a founding family with a third of the shares
- **Meridian Foundation** - UK charity, unpaid trustees, the Charity Commission, a founder who can't let go
- **Straits Financial Group** - Singapore-listed bank, SGX and MAS, Temasek as anchor shareholder, the nine-year independence rule

**Core gameplay loop:**
- Build your board from a pool of director candidates, each with independence ratings, skills, and stamina
- Navigate a year of board papers across four quarters (76 events in total) - crises, opportunities, regulatory flashpoints
- Manage your Governance Capital score and director dynamics simultaneously
- Survive the AGM: three resolutions, three separate votes, counted shareholder block by block
- Read your Governance Debrief at year-end - every decision, what it led to, and the code provision behind it (saves as a PDF)

**Governance mechanics modelled:**
- Board composition rules (independence, diversity, skills matrix)
- Jurisdiction-specific compliance rules (UK Code, NYSE/SEC, German AktG/DCGK, Charity Governance Code, SGX/MAS)
- Proxy adviser scoring (ISS / Glass Lewis-style logic)
- Decisions that change the board itself: resignations, removals, appointments, new committees
- Stamina depletion and director burnout
- Wildcard outcomes and resolution engine

---

## Why I Built It

I work in corporate governance and investor stewardship. The concepts in this game - board composition, fiduciary duty, AGM dynamics, proxy adviser influence - are ones I engage with professionally. I built BoardCraft to demonstrate that domain knowledge in a format that's immediate, interactive, and hard to fake.

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

Built with Next.js, TypeScript, Tailwind CSS and three.js (the 3D office). Deployed on Vercel. Developed using AI-assisted coding. The governance logic, game design, and domain accuracy are entirely my own; Claude helped me build it faster.

---

## Status

✅ Playable now - five companies, 3D office and world map, board papers, live AGM count, control-room dashboard, Governance Debrief, career meta-game with leaderboard  
🔜 In development - Australia (ASX) and 'Valdoria' (a fictional country with emerging market governance)

---

## Running Locally

```bash
git clone https://github.com/asafrubin00/boardcraft.git
cd boardcraft
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
