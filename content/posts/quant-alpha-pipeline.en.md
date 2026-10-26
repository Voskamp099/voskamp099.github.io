What I started with was plain. On the WorldQuant BRAIN site: find a dataset, pick fields, write an expression, click simulate, wait for the result, check whether Sharpe and fitness clear the bar, and submit if they do.

The whole thing ended up with a name: AlphaForge. This is how it went from clicking in a browser to a pipeline that can be re-run and understood.

The platform has its own thresholds. Sharpe above 1.25, fitness above 1.0, and separate checks on turnover, weight concentration, and sub-universe Sharpe. The first submission that went through felt good, but it became clear quickly that the path was too slow.

A simulation queues, one idea needs several fields, several windows, and several operator combinations, and clicking through it by hand eats an afternoon. Everything also lives only in the browser: close the tab and the experiment record is gone.

## Moving the research into VSCode

The next step was to run the research locally, with a script that does four things: authenticate, start a simulation, poll for the result, and write the metrics to a CSV.

The biggest change was not speed but traceability. Every simulation's expression, settings, returned alpha id, and full metric set lands in a local file that can be revisited later, and the run can resume from where it stopped.

The platform limits request frequency, so the scripts share a global request gate: every research process takes the same file lock, keeps at least two seconds between requests, and backs off using Retry-After when it hits a rate limit. This is not an optimization. It is required — after the account gets throttled, nothing works for a while.

## Letting an agent drive

With the scripts in place, I started driving them with an agent. The point is not "let AI write the code." The point is to define the layers first, so the agent knows which one to touch:

- **Configuration layer**: region, universe, windows, operators, interaction pairs, thresholds. Edit one JSON file; no code changes.
- **Single-cell surgery**: add one transform, change one piece of logic. The agent touches exactly one cell.
- **New stage**: add a whole new step, such as a multi-window robustness check. The agent adds a cell and leaves the old logic intact.
- **Refactor**: almost never triggered; align on the plan first.

Most ideas land in the first two layers. The conversation becomes one sentence: "I want to try momentum crossed with earnings revision." The agent says which file to change, then changes it.

There is one human gate in the middle. The machine can pull the field library and filter by coverage, but which fields are worth testing and in which direction is my call. I tick a short list of about thirty rows; everything else is automatic.

## Classifying the alphas

Once the pipeline ran unattended, a new problem appeared: too many alphas to read. Several hundred candidates stayed in the in-sample stage and only about fifty were submitted. Reading them one by one was not realistic.

So I added a step that splits each expression into "legs" by economic meaning and then counts them. An alpha is usually a combination of two or three legs, such as liabilities relative to market cap plus operating cash flow relative to assets, or a drop with volume plus an options implied-volatility skew. Counting the frequency of each leg makes several conclusions obvious:

- The whole portfolio rests on fourteen signal families, and the two most reused are the options implied-volatility skew and short-window reversal.
- The grade is driven almost entirely by fitness, not Sharpe. Once turnover climbs, a strong Sharpe gets downgraded anyway.
- Failures concentrate: 64.7% miss the fitness bar, 53.5% miss the Sharpe bar, and the rest are sub-universe instability, concentrated weight, and excessive turnover.
- More than two hundred passed every platform check and were still not submitted, because they were too close to what was already in the book.

The last one matters most. Two hundred-plus candidates cleared the platform's bar and only about fifty got in. What was actually blocking the work was not the Sharpe threshold but the portfolio's orthogonality budget.

## Where this stands

The method works end to end: start by hand, hand over to scripts, let an agent drive, close the loop with classification.

What is still unsolved is where the next signals come from. The submitted portfolio has a median self-correlation of 0.68, right against the duplication ceiling. The next increment will not come from running the same combination search again; it will come from finding information sources that are genuinely not used yet.

As for which fields, and the full metrics and failure detail for each alpha, I kept that local and did not publish it.
