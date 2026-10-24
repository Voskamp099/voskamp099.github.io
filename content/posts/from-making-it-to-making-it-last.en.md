> This one is still being written. It follows a path that isn't finished yet; every section will probably be revised at least once.

## A rainy season and a crowd of a hundred thousand

In the summer of 2024 I was doing something that now sounds very plain.

I joined an education startup. Its founder had prepared for the postgraduate entrance exams himself and knew the traps, so he started with free exam Q&A and discussions about study plans in a WeChat group. That grew into a community of roughly a hundred thousand people.

His line stayed with me: having been caught in the rain ourselves, we wanted to hold an umbrella for others. That was the reason I stayed.

My part was specific: wiring a large language model into a WeChat mini program to make a tutor that could hold a conversation with students preparing for those exams. It was my first time vibe coding, and my first product with actual users.

We argued a lot that summer about which features actually mattered and which could wait. Eventually we would cut an idea down to a version two people could finish in two months, split the work, define what "done" meant, and turn a demo into something a real person could use.

Later I became a co-founder and CTO.

Seeing students actually use it is hard to describe. Something I had written got opened by a stranger, and got used.

## The moment I sat up straight

In August 2025 I went to Berkeley as a visiting student and stayed until the spring.

I spent that year at demo days and hackathons, meeting people from very different backgrounds — one from the Dominican Republic, one who had just finished a master's at Northeastern.

Then there was one evening when, at two completely different events, I heard almost the same idea: rearranging furniture in a 3D scene of your own home, so you could see whether it looks right together before you buy.

I was astonished enough that I wanted to introduce the two people to each other.

An idea that felt new to me had already taken shape in someone else's head.

After that I started asking a question I had never asked before: if a prototype is easy to copy, what lets this team keep going?

## The credits I gave up on purpose

A few of the courses on my Berkeley transcript were taken pass/no-pass. No letter grade.

My reasoning at the time: learning can happen anywhere, and back in China I could make up for it with a furious semester. But sitting in a room in San Francisco while a stranger explains how they staked everything on one idea — that opportunity does not come around every day.

I would rather pass those courses and spend the time at more demo days, talking to more people.

I have not regretted the choice. I did learn what it costs. Grades look solid, but they measure whether you stayed in the room long enough; they do not measure whether you were actually present.

Over the same stretch I was also leading tech for a student association, moving its site from static HTML to React, and having to explain technical choices out loud to an all-English team and then actually ship them.

## Learning to look for the barrier

In the summer of 2026 I went back to China and took an investment analysis internship at a fund, on the AI inference chip track.

I had two weeks. I led a six-person subgroup through a deep dive on that track and handed in a thirteen-page report. We read business plans, wrote down the partners' questions during meetings, and turned the material into a structure we could screen with.

What actually changed me was not the report. It was how I looked at things.

Before, I judged a project mostly by: is the idea new, is the market large, do the founders look reliable.

Here, I had to ask: what technical barrier are they stuck behind, and how long would it take someone else to clear it?

The same business plan, the same team, two different ways of looking — and the conclusions were not the same.

I also noticed something else in those two weeks: technical capability and product do not connect on their own. There is a stretch in between, and somebody has to actually walk it. I use Zhipu's coding model every day, and the way it understood what I meant surprised me; later I found that the team behind it came out of research at Tsinghua. That pushed me to want to understand one thing properly: how does a technical capability become something real people actually use?

## Laying the ground under my judgement

The question about what lets a team keep going, I did not answer by thinking about it. I answered it by doing it.

First was patent classification. Over five hundred thousand patent records, three approaches implemented in Python, each using a different amount of the patent text, testing whether a model could predict the first four characters of an IPC code. The evaluation covered every record, and one approach clearly did better. That project made me take reproducibility seriously for the first time: same prompt, same data, run it again, the numbers have to line up.

Then social media opinion forecasting. I set up GPU training infrastructure and fine-tuned EvalNet, a RoBERTa-based evaluation model, scoring summary quality on SummEval. Only after that did I actually feel the seam between training and inference infrastructure.

After that came dataset and evaluation-sample construction for a multimodal video team: video-to-video and reference-video-to-video, with tasks in semantic segmentation and time-series prediction. The slow part was never annotation — it was checking that every target really matched its prompt. One mismatched sample makes an entire evaluation look accurate while being wrong.

Then a deterministic task generator: fixed random seeds, one run produces reproducible samples with answers, no GPU needed. If anyone can run the same data, it can be used for evaluation at all.

None of these is large on its own. Put together, they gave me a position I could stand on: at least in the directions I have looked at, I know how to turn a vague judgement into something that can be checked.

## Knowing how to build is not enough to move

By then I had a new problem.

I knew the direction, but every step snagged on operational detail: changing one piece of logic meant re-reading the whole thing, running a batch of experiments meant clicking a lot, and finding what I had done last time depended entirely on memory.

I did not like the feeling of knowing where to go and still not being able to move, so I started building tools.

I wrote myself an essay workflow. Every draft passes the same fixed checks: are the facts within bounds, has the prompt drifted, word count, can every claim be traced, do consecutive sentences actually connect. The machine runs the checks; I make the calls.

Writing was always the thing that cost me the most time and depended most on my mood. Now it is at least reproducible — the same standard, applied again and again.

Quant was the same. I started by clicking alphas one at a time on the WorldQuant BRAIN site, moved the research into local scripts, and then let an agent run the whole pipeline: simulate, record, classify. I wrote about that flow separately.

There was also a job building "counterfactual" data for a video generation model. The samples had to genuinely correspond to their prompts, or the evaluation would be fake. Doing it once taught me that a data pipeline is only trustworthy if the checks live inside the generation, not bolted on afterwards.

## Where this stands now

To put these years in one sentence: what I want to do has kept changing, but the way it changes has stayed the same.

At first it was "I want to build a thing".

Then it became "I want to know whether it can go the distance".

Then it became "I want to lay the ground under my judgement".

And those three are the same thing: taking something vague and turning it into something that runs.

What runs has changed, though. At first it was a product. Later it was judgement.

This story isn't finished. The next piece will probably be about taking that toolbox further than quant.
